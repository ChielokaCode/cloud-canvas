import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';


const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loginWithUser, isAuthenticated } = useAuth();

  
useEffect(() => {
  if (isAuthenticated) {
    navigate('/browse', { replace: true });
  }
}, [isAuthenticated, navigate]);



const handleSignIn = async () => {
  if (!email || !password) {
    toast({ title: "Error", description: "All fields are required", variant: "destructive" });
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("http://localhost:7071/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);


    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data?.user?.id);
    localStorage.setItem("userName", data?.user?.name);
    localStorage.setItem("userRole", data?.user?.role);
    console.log("User role:", data.user?.role);

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      createdAt: new Date(),
    };

    loginWithUser(user);

    toast({ title: "Success", description: `Welcome, ${user.name}!` });

    navigate(
      user.role === "creator" ? "/creator" : "/browse",
      { replace: true }
    );
  } catch (err: any) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center">
        <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 p-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Home
      </button>
      <div className="bg-card p-8 rounded-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2" />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
        <Button onClick={handleSignIn} disabled={loading} className="w-full">
          {loading ? "Signing In..." : "Sign In"}
        </Button>
        <p className="mt-4 text-sm text-center">
          Creator sign in? <Link to="/signup-creator" className="text-blue-500">Sign Up</Link>
        </p>
        <p className="mt-4 text-sm text-center">
          Consumer sign in? <Link to="/signup-consumer" className="text-blue-500">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
