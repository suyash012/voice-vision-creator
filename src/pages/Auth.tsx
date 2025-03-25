
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignIn) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Successfully signed in!");
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success("Sign up successful! Please check your email for verification.");
      }
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Authentication failed. Please try again.");
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="glass-panel p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                {isSignIn ? "Sign in to your account" : "Create an account"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSignIn
                  ? "Enter your credentials to access your projects"
                  : "Sign up to start creating faceless videos"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  {isSignIn && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : isSignIn ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                {isSignIn ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setIsSignIn(!isSignIn)}
                  className="ml-1 text-primary hover:underline"
                >
                  {isSignIn ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
