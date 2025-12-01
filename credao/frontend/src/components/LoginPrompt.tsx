import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, ShoppingBasket, Leaf, TrendingUp } from 'lucide-react';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Sprout className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground">Welcome to Credao</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Connecting local farmers and gardeners with buyers for fresh, sustainable produce
          </p>
          <Button size="lg" onClick={handleLogin} disabled={loginStatus === 'logging-in'} className="gap-2">
            {loginStatus === 'logging-in' ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logging in...
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Garden Management</CardTitle>
              <CardDescription>
                Draw your garden boundaries on an interactive map and manage crops with a 1x1 meter grid system
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Growth Tracking</CardTitle>
              <CardDescription>
                Track crop stages with predictive harvest estimation and receive care reminders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingBasket className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Local Marketplace</CardTitle>
              <CardDescription>
                Browse and purchase fresh produce directly from local farmers and gardeners
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Image Banner */}
        <div className="mt-12 overflow-hidden rounded-lg">
          <img
            src="/assets/generated/marketplace-scene.dim_800x400.jpg"
            alt="Fresh produce marketplace"
            className="h-64 w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
