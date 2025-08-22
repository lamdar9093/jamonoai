import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Shield, 
  Eye, 
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Building2
} from "lucide-react";
import { Link } from "wouter";

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de connexion');
      }
      return response.json();
    },
    onSuccess: (result: any) => {
      login(result.user, result.token);
      toast({
        title: "Connexion réussie !",
        description: `Bienvenue ${result.user.name || result.user.email}`,
      });
      
      // Redirection basée sur le type de tenant
      if (result.tenant?.tenantType === 'enterprise') {
        setLocation(`/tenant/${result.tenant.id}/dashboard`);
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignInFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Back to Home */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="p-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Jamono</h1>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Connexion
            </h2>
            <p className="text-slate-600">
              Accédez à votre espace de travail multi-agent
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Se connecter</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="votre-email@entreprise.com" 
                            type="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="••••••••" 
                              type={showPassword ? "text" : "password"}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showPassword ? "Cacher" : "Afficher"} le mot de passe
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </Form>

              {/* Links */}
              <div className="mt-6 text-center space-y-4">
                <div className="text-sm">
                  <a href="#" className="text-primary hover:underline">
                    Mot de passe oublié ?
                  </a>
                </div>
                
                <div className="text-sm text-slate-600">
                  Pas encore de compte ?{" "}
                  <Link href="/account-type">
                    <a className="text-primary hover:underline font-medium">
                      Choisir mon type d'espace
                    </a>
                  </Link>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-600 mb-3">
                    Créer rapidement un espace :
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/enterprise/onboard">
                      <Button variant="outline" size="sm" className="w-full">
                        <Building2 className="mr-1 h-3 w-3" />
                        Entreprise
                      </Button>
                    </Link>
                    <Link href="/freelance/onboard">
                      <Button variant="outline" size="sm" className="w-full">
                        <Building2 className="mr-1 h-3 w-3" />
                        Freelance
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}