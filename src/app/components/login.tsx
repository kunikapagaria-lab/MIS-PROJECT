import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { login } from "../data/auth";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = login(username, password);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    navigate("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-24 h-80 w-80 rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
      </div>
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md bg-[#fffaf6]/95 rounded-3xl shadow-[0_24px_60px_rgba(168,88,31,0.22)] p-8 space-y-5 border border-orange-100"
      >
        <h1 className="text-3xl font-bold text-[#3b2214]">Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full px-4 py-3 border border-orange-200/90 bg-white/85 rounded-xl"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full px-4 py-3 border border-orange-200/90 bg-white/85 rounded-xl"
        />
        <button
          type="submit"
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold shadow-[0_10px_24px_rgba(255,109,0,0.28)]"
        >
          Login
        </button>
        <p className="text-sm text-[#6b4e3a]">
          No account?{" "}
          <Link to="/signup" className="text-orange-600 font-semibold">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
