import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetup from './components/ProfileSetup';
import GardenGrid from './pages/GardenGrid';
import MyAssets from './pages/MyAssets';
import Calendar from './pages/Calendar';
import Marketplace from './pages/Marketplace';
import LoginPrompt from './components/LoginPrompt';
import { Sprout } from 'lucide-react';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [activeTab, setActiveTab] = useState('marketplace');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    // If user is authenticated and has a profile, default to garden grid for sellers
    if (isAuthenticated && userProfile && userProfile.isSeller) {
      setActiveTab('garden');
    }
  }, [isAuthenticated, userProfile]);

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sprout className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <>
        <ProfileSetup />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1">
        {!isAuthenticated ? (
          <LoginPrompt />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-card/50">
              <div className="container mx-auto px-4">
                <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-transparent">
                  <TabsTrigger value="garden" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Garden Grid
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    My Assets
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="marketplace" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Marketplace
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="garden" className="mt-0">
              <GardenGrid />
            </TabsContent>

            <TabsContent value="assets" className="mt-0">
              <MyAssets />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <Calendar />
            </TabsContent>

            <TabsContent value="marketplace" className="mt-0">
              <Marketplace />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}
