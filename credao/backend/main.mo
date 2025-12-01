import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Array "mo:base/Array";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
    location : Text;
    isSeller : Bool;
    // Other user metadata if needed
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // Storage for gardens, crops, listings, orders, and alerts
  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);

  var nextGardenId = 0;
  var nextCropId = 0;
  var nextListingId = 0;
  var nextOrderId = 0;
  var nextAlertId = 0;

  var gardens = natMap.empty<Garden>();
  var crops = natMap.empty<Crop>();
  var listings = natMap.empty<MarketplaceListing>();
  var orders = natMap.empty<Order>();
  var alerts = natMap.empty<Alert>();

  // Data types
  public type Coordinate = {
    lat : Float;
    lng : Float;
  };

  public type GardenType = {
    #mapBased;
    #gridBased;
  };

  public type Garden = {
    id : Nat;
    owner : Principal;
    name : Text;
    boundary : [Coordinate];
    gridSize : Nat;
    gardenType : GardenType;
    width : Nat;
    height : Nat;
    createdAt : Time.Time;
  };

  public type Crop = {
    id : Nat;
    gardenId : Nat;
    name : Text;
    species : Text;
    stage : Text;
    plantingDate : Time.Time;
    harvestDate : Time.Time;
    gridPositions : [(Nat, Nat)];
    sensorLink : ?Text;
  };

  public type MarketplaceListing = {
    id : Nat;
    seller : Principal;
    cropId : Nat;
    price : Nat;
    quantity : Nat;
    status : Text;
    createdAt : Time.Time;
    harvestDate : Time.Time;
    stage : Text;
    isHarvestReady : Bool;
  };

  public type Order = {
    id : Nat;
    buyer : Principal;
    listingId : Nat;
    quantity : Nat;
    totalPrice : Nat;
    status : Text;
    createdAt : Time.Time;
  };

  public type Alert = {
    id : Nat;
    user : Principal;
    message : Text;
    alertType : Text;
    createdAt : Time.Time;
  };

  // Helper function to check if a crop is listed in the marketplace
  private func isCropListed(cropId : Nat) : Bool {
    let allListings = Iter.toArray(natMap.vals(listings));
    Array.find(allListings, func(l : MarketplaceListing) : Bool { l.cropId == cropId }) != null;
  };

  // Helper function to check if a garden has any listed crops
  private func hasListedCrops(gardenId : Nat) : Bool {
    let gardenCrops = Iter.toArray(natMap.vals(crops));
    let gardenCropIds = Array.map(
      Array.filter(gardenCrops, func(c : Crop) : Bool { c.gardenId == gardenId }),
      func(c : Crop) : Nat { c.id }
    );

    Array.find(gardenCropIds, func(cropId : Nat) : Bool { isCropListed(cropId) }) != null;
  };

  // Garden operations
  public shared ({ caller }) func createGarden(name : Text, boundary : [Coordinate], gridSize : Nat, gardenType : GardenType, width : Nat, height : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create gardens");
    };

    let gardenId = nextGardenId;
    nextGardenId += 1;

    let garden : Garden = {
      id = gardenId;
      owner = caller;
      name;
      boundary;
      gridSize;
      gardenType;
      width;
      height;
      createdAt = Time.now();
    };

    gardens := natMap.put(gardens, gardenId, garden);
    gardenId;
  };

  public query ({ caller }) func getGarden(gardenId : Nat) : async ?Garden {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view gardens");
    };

    let garden = natMap.get(gardens, gardenId);
    switch (garden) {
      case (null) { null };
      case (?g) {
        // Allow access if: owner, admin, or garden has listed crops (for marketplace buyers)
        let isOwner = g.owner == caller;
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        let isPubliclyListed = hasListedCrops(gardenId);

        if (not isOwner and not isAdmin and not isPubliclyListed) {
          Debug.trap("Unauthorized: Can only view your own gardens or gardens with marketplace listings");
        };
        ?g;
      };
    };
  };

  public query ({ caller }) func getAllGardens() : async [Garden] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view gardens");
    };

    // Users can only see their own gardens, admins can see all
    let allGardens = Iter.toArray(natMap.vals(gardens));
    if (AccessControl.isAdmin(accessControlState, caller)) {
      allGardens;
    } else {
      Array.filter(allGardens, func(g : Garden) : Bool { g.owner == caller });
    };
  };

  // Crop operations
  public shared ({ caller }) func addCrop(gardenId : Nat, name : Text, species : Text, stage : Text, plantingDate : Time.Time, harvestDate : Time.Time, gridPositions : [(Nat, Nat)], sensorLink : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add crops");
    };

    let garden = natMap.get(gardens, gardenId);
    switch (garden) {
      case (null) { Debug.trap("Garden not found") };
      case (?g) {
        if (g.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only add crops to your own gardens");
        };

        let cropId = nextCropId;
        nextCropId += 1;

        let crop : Crop = {
          id = cropId;
          gardenId;
          name;
          species;
          stage;
          plantingDate;
          harvestDate;
          gridPositions;
          sensorLink;
        };

        crops := natMap.put(crops, cropId, crop);
        return cropId;
      };
    };
  };

  public query ({ caller }) func getCrop(cropId : Nat) : async ?Crop {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view crops");
    };

    let crop = natMap.get(crops, cropId);
    switch (crop) {
      case (null) { null };
      case (?c) {
        let garden = natMap.get(gardens, c.gardenId);
        switch (garden) {
          case (null) { null };
          case (?g) {
            // Allow access if: owner, admin, or crop is listed in marketplace (for buyers)
            let isOwner = g.owner == caller;
            let isAdmin = AccessControl.isAdmin(accessControlState, caller);
            let isPubliclyListed = isCropListed(cropId);

            if (not isOwner and not isAdmin and not isPubliclyListed) {
              Debug.trap("Unauthorized: Can only view your own crops or crops listed in marketplace");
            };
            ?c;
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllCrops() : async [Crop] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view crops");
    };

    // Users can only see crops from their own gardens, admins can see all
    let allCrops = Iter.toArray(natMap.vals(crops));
    if (AccessControl.isAdmin(accessControlState, caller)) {
      allCrops;
    } else {
      Array.filter(allCrops, func(c : Crop) : Bool {
        let garden = natMap.get(gardens, c.gardenId);
        switch (garden) {
          case (null) { false };
          case (?g) { g.owner == caller };
        };
      });
    };
  };

  // Marketplace operations
  public shared ({ caller }) func createListing(cropId : Nat, price : Nat, quantity : Nat, status : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create listings");
    };

    // Verify caller has a seller profile
    let profile = principalMap.get(userProfiles, caller);
    switch (profile) {
      case (null) {
        Debug.trap("Unauthorized: Must have a user profile to create listings");
      };
      case (?p) {
        if (not p.isSeller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Only sellers can create marketplace listings");
        };
      };
    };

    let crop = natMap.get(crops, cropId);
    switch (crop) {
      case (null) { Debug.trap("Crop not found") };
      case (?c) {
        let garden = natMap.get(gardens, c.gardenId);
        switch (garden) {
          case (null) { Debug.trap("Garden not found") };
          case (?g) {
            if (g.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Debug.trap("Unauthorized: Can only list your own crops");
            };

            let listingId = nextListingId;
            nextListingId += 1;

            let isHarvestReady = c.stage == "harvest-ready";

            let listing : MarketplaceListing = {
              id = listingId;
              seller = caller;
              cropId;
              price;
              quantity;
              status;
              createdAt = Time.now();
              harvestDate = c.harvestDate;
              stage = c.stage;
              isHarvestReady;
            };

            listings := natMap.put(listings, listingId, listing);
            return listingId;
          };
        };
      };
    };
  };

  // Public marketplace browsing - requires authenticated users (buyers/sellers)
  public query ({ caller }) func getAllListings() : async [MarketplaceListing] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can browse marketplace");
    };
    Iter.toArray(natMap.vals(listings));
  };

  // Order operations
  public shared ({ caller }) func createOrder(listingId : Nat, quantity : Nat, totalPrice : Nat, status : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create orders");
    };

    let listing = natMap.get(listings, listingId);
    switch (listing) {
      case (null) { Debug.trap("Listing not found") };
      case (?l) {
        // Prevent sellers from buying their own listings
        if (l.seller == caller) {
          Debug.trap("Unauthorized: Cannot purchase your own listings");
        };

        // Only allow orders for harvest-ready crops
        if (not l.isHarvestReady) {
          Debug.trap("Cannot order crops that are not harvest-ready");
        };

        // Validate quantity and total price
        if (quantity <= 0) {
          Debug.trap("Quantity must be greater than 0");
        };

        if (quantity > l.quantity) {
          Debug.trap("Requested quantity exceeds available stock");
        };

        let expectedTotalPrice = l.price * quantity;
        if (totalPrice != expectedTotalPrice) {
          Debug.trap("Total price does not match expected value");
        };

        let orderId = nextOrderId;
        nextOrderId += 1;

        let order : Order = {
          id = orderId;
          buyer = caller;
          listingId;
          quantity;
          totalPrice;
          status;
          createdAt = Time.now();
        };

        orders := natMap.put(orders, orderId, order);

        // Update listing quantity
        let updatedListing : MarketplaceListing = {
          l with quantity = l.quantity - quantity;
        };
        listings := natMap.put(listings, listingId, updatedListing);

        return orderId;
      };
    };
  };

  public query ({ caller }) func getOrder(orderId : Nat) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view orders");
    };

    let order = natMap.get(orders, orderId);
    switch (order) {
      case (null) { null };
      case (?o) {
        // Buyers can view their own orders, sellers can view orders for their listings, admins can view all
        let listing = natMap.get(listings, o.listingId);
        let isSeller = switch (listing) {
          case (null) { false };
          case (?l) { l.seller == caller };
        };

        if (o.buyer != caller and not isSeller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only view your own orders or orders for your listings");
        };
        ?o;
      };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view orders");
    };

    // Users can only see their own orders (as buyer) or orders for their listings (as seller), admins can see all
    let allOrders = Iter.toArray(natMap.vals(orders));
    if (AccessControl.isAdmin(accessControlState, caller)) {
      allOrders;
    } else {
      Array.filter(allOrders, func(o : Order) : Bool {
        if (o.buyer == caller) {
          return true;
        };
        // Check if caller is the seller of the listing
        let listing = natMap.get(listings, o.listingId);
        switch (listing) {
          case (null) { false };
          case (?l) { l.seller == caller };
        };
      });
    };
  };

  // Alert operations
  public shared ({ caller }) func createAlert(message : Text, alertType : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create alerts");
    };

    let alertId = nextAlertId;
    nextAlertId += 1;

    let alert : Alert = {
      id = alertId;
      user = caller;
      message;
      alertType;
      createdAt = Time.now();
    };

    alerts := natMap.put(alerts, alertId, alert);
    alertId;
  };

  public query ({ caller }) func getUserAlerts() : async [Alert] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view alerts");
    };

    let userAlerts = Iter.toArray(natMap.vals(alerts));
    Array.filter(userAlerts, func(a : Alert) : Bool { a.user == caller });
  };

  // File storage integration
  let storage = Storage.new();
  include MixinStorage(storage);

  // Track file references
  public type Data = {
    id : Text;
    blob : Storage.ExternalBlob;
    name : Text;
    // other metadata
  };

  // Stripe integration
  var configuration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Debug.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    // Add authorization check if needed.
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Growth stage update operation
  public shared ({ caller }) func updateGrowthStage(cropId : Nat, newStage : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update growth stages");
    };

    let crop = natMap.get(crops, cropId);
    switch (crop) {
      case (null) { Debug.trap("Crop not found") };
      case (?c) {
        let garden = natMap.get(gardens, c.gardenId);
        switch (garden) {
          case (null) { Debug.trap("Garden not found") };
          case (?g) {
            if (g.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Debug.trap("Unauthorized: Can only update your own crops");
            };

            // Update crop stage
            let updatedCrop : Crop = {
              c with stage = newStage;
            };
            crops := natMap.put(crops, cropId, updatedCrop);

            // Update associated marketplace listing if exists
            let allListings = Iter.toArray(natMap.vals(listings));
            let listing = Array.find(allListings, func(l : MarketplaceListing) : Bool { l.cropId == cropId });

            switch (listing) {
              case (null) {};
              case (?l) {
                let isHarvestReady = newStage == "harvest-ready";
                let updatedListing : MarketplaceListing = {
                  l with stage = newStage;
                  isHarvestReady;
                };
                listings := natMap.put(listings, updatedListing.id, updatedListing);
              };
            };
          };
        };
      };
    };
  };
};
