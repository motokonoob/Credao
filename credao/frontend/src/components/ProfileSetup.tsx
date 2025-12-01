import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sprout } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !location.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        location: location.trim(),
        isSeller: role === 'seller',
      });
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Sprout className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to Credao</CardTitle>
          <CardDescription>Set up your profile to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>I want to:</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'seller' | 'buyer')}>
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="flex-1 cursor-pointer">
                    <div className="font-medium">Sell produce</div>
                    <div className="text-sm text-muted-foreground">
                      Manage gardens and list crops for sale
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                    <div className="font-medium">Buy produce</div>
                    <div className="text-sm text-muted-foreground">
                      Browse and purchase fresh local produce
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
