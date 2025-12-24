import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from '@/config/azureConfig';

const SignUpCreator = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setLoading(true);

    if (!email || !password || !name) {
  toast({ title: "Error", description: "All fields are required", variant: "destructive" });
  setLoading(false);
  return;
}

    try {
      const res = await fetch(`${API_BASE_URL}/signup-creator`, { // updated URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      // const text = await res.text();
      // const data = text ? JSON.parse(text) : {};

      const data = await res.json();


      if (!res.ok) {
        throw new Error(data.error || data.message || "Signup failed");
      }

      toast({ title: "Success", description: "Account created!" });
      navigate("/signin");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
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
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-2"
        />

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2"
        />

        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4"
        />

        <Button onClick={handleSignUp} disabled={loading} className="w-full">
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-500">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpCreator;
