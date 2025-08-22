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
  CheckCircle,
  ArrowLeft,
  Building2
} from "lucide-react";
import { Link } from "wouter";

const signUpSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const { confirmPassword, ...requestData } = data;
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }
      return response.json();
    },
    onSuccess: (result: any) => {
      login(result.user, result.token);
      toast({
        title: "Compte créé avec succès !",
        description: `Bienvenue ${result.user.name} ! Votre compte a été créé.`,
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
        title: "Erreur lors de la création",
        description: error.message || "Une erreur est survenue lors de la création du compte",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignUpFormData) => {
    signUpMutation.mutate(data);
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
              Créer un compte
            </h2>
            <p className="text-slate-600">
              Rejoignez la révolution de la main d'œuvre numérique
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
              <CardDescription>
                Créez votre compte pour commencer à utiliser nos agents IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Jean Dupont" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="jean.dupont@entreprise.com" 
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="••••••••" 
                              type={showConfirmPassword ? "text" : "password"}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showConfirmPassword ? "Cacher" : "Afficher"} le mot de passe
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      En créant un compte, vous acceptez nos{" "}
                      <a href="#" className="underline">conditions d'utilisation</a> et notre{" "}
                      <a href="#" className="underline">politique de confidentialité</a>.
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signUpMutation.isPending}
                  >
                    {signUpMutation.isPending ? "Création du compte..." : "Créer mon compte"}
                  </Button>
                </form>
              </Form>

              {/* Links */}
              <div className="mt-6 text-center space-y-4">
                <div className="text-sm text-slate-600">
                  Déjà un compte ?{" "}
                  <Link href="/sign-in">
                    <a className="text-primary hover:underline font-medium">
                      Se connecter
                    </a>
                  </Link>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-600 mb-2">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Vous représentez une entreprise ?
                  </div>
                  <Link href="/enterprise/onboard">
                    <Button variant="outline" className="w-full">
                      Créer un espace tenant
                    </Button>
                  </Link>
                  <p className="text-xs text-slate-500 mt-2">
                    Configurez votre propre espace multi-agent avec intégrations personnalisées
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}