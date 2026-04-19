import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

// Loading quips
const LOADING_QUIPS = [
  "adjusting my glasses...",
  "...oh honey",
  "hmm",
  "okay let's see what we're working with",
  "taking notes",
  "bev is thinking...",
];

// Auth Component
function AuthSection() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("flow", flow);
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Wrong email or password, honey." : "Couldn't create account. Try again.");
    }
  };

  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <button
        onClick={() => signOut()}
        className="text-sm text-[--potting-soil] opacity-60 hover:opacity-100 transition-opacity font-body"
      >
        Sign out
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <details className="relative">
        <summary className="cursor-pointer text-sm text-[--potting-soil] opacity-60 hover:opacity-100 transition-opacity font-body list-none">
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </summary>
        <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-2xl p-6 w-72 border border-[--bev-green]/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[--bev-green]/30 focus:border-[--bev-green] focus:outline-none font-body text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[--bev-green]/30 focus:border-[--bev-green] focus:outline-none font-body text-sm"
            />
            {error && <p className="text-[--hot-coral] text-xs font-accent">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[--potting-soil] text-white py-3 rounded-full font-body text-sm hover:bg-[--garden-dark] transition-colors"
            >
              {flow === "signIn" ? "Sign in" : "Sign up"}
            </button>
            <button
              type="button"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="w-full text-[--bev-green] text-sm font-accent"
            >
              {flow === "signIn" ? "Need an account? Sign up" : "Already have one? Sign in"}
            </button>
            <button
              type="button"
              onClick={() => signIn("anonymous")}
              className="w-full text-[--potting-soil]/50 text-xs font-body hover:text-[--potting-soil] transition-colors"
            >
              Continue as guest
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}

// Score Circle Component
function ScoreCircle({ score }: { score: number | null }) {
  if (score === null) return null;

  const color = score < 50 ? "var(--hot-coral)" : score < 80 ? "var(--sunshine)" : "var(--bev-green)";

  return (
    <div
      className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white font-display text-3xl md:text-4xl font-bold shadow-lg"
      style={{ backgroundColor: color }}
    >
      {score}
    </div>
  );
}

// Fix Card Component
function FixCard({ fix }: { fix: { title: string; detail: string } }) {
  return (
    <div className="bg-[--mint-wash] border-l-4 border-[--bev-green] rounded-lg p-4 md:p-5">
      <h4 className="font-display text-base md:text-lg text-[--potting-soil] mb-1">{fix.title}</h4>
      <p className="font-body text-sm text-[--potting-soil]/70">{fix.detail}</p>
    </div>
  );
}

// Result Component
function RoastResult({ result, onReset }: {
  result: {
    score: number | null;
    verdictTier: string;
    oneLiner: string;
    roastParagraph: string;
    fixes: Array<{ title: string; detail: string }>;
    recommendedCollection: { name: string; tier: string; whyThisOne: string } | null;
  };
  onReset: () => void;
}) {
  const collectionSlug = result.recommendedCollection?.name.toLowerCase().replace(/\s+/g, "-") || "";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 md:space-y-8 animate-fade-in px-4">
      {/* Score Card */}
      <div className="bg-[--lemon-mist] border-2 border-[--sunshine] rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
        <ScoreCircle score={result.score} />
        <div className="text-center sm:text-left">
          <h3 className="font-display text-xl md:text-2xl text-[--potting-soil]">{result.verdictTier}</h3>
          <p className="font-accent text-lg md:text-xl text-[--potting-soil]/70">{result.oneLiner}</p>
        </div>
      </div>

      {/* The Verdict */}
      <div className="bg-[--potting-soil] rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <span className="absolute -top-4 -left-2 font-display text-7xl md:text-9xl text-[--bev-green] opacity-30">"</span>
        <p className="font-body text-white text-base md:text-lg leading-relaxed relative z-10">
          {result.roastParagraph}
        </p>
      </div>

      {/* Fixes */}
      {result.fixes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.fixes.map((fix, i) => (
            <FixCard key={i} fix={fix} />
          ))}
        </div>
      )}

      {/* Bev's Prescription */}
      {result.recommendedCollection && (
        <div className="bg-[--mint-wash] border-2 border-[--bev-green] rounded-2xl p-5 md:p-6">
          <p className="font-accent text-[--bev-green] text-base md:text-lg mb-2">Bev's prescription:</p>
          <h4 className="font-display text-xl md:text-2xl text-[--potting-soil] mb-2">
            {result.recommendedCollection.name}
          </h4>
          <p className="font-body text-sm md:text-base text-[--potting-soil]/70 mb-4">
            {result.recommendedCollection.whyThisOne}
          </p>
          <a
            href={`/products/${collectionSlug}?utm_source=roaster&utm_medium=tool&utm_campaign=${collectionSlug}`}
            className="inline-block bg-[--bev-green] text-white px-5 py-3 rounded-full font-body text-sm hover:bg-[--garden-dark] transition-colors"
          >
            See {result.recommendedCollection.name} →
          </a>
        </div>
      )}

      {/* Secondary CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/book?utm_source=roaster"
          className="bg-[--potting-soil] text-white px-6 py-3 rounded-full font-body text-sm text-center hover:bg-[--garden-dark] transition-colors"
        >
          Book a free consult
        </a>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Yard Roast from Bev",
                text: `Bev gave my yard a ${result.score}/100: "${result.oneLiner}"`,
                url: window.location.href,
              });
            }
          }}
          className="bg-white border-2 border-[--hot-coral] text-[--hot-coral] px-6 py-3 rounded-full font-body text-sm hover:bg-[--hot-coral] hover:text-white transition-colors"
        >
          Share my roast 📸
        </button>
      </div>

      {/* Try Again */}
      <button
        onClick={onReset}
        className="w-full text-center font-accent text-[--bev-green] text-lg hover:underline"
      >
        roast another yard
      </button>
    </div>
  );
}

// Sample Roast Component
function SampleRoast() {
  const recentRoast = useQuery(api.roasts.getRecent);

  const sampleData = recentRoast || {
    score: 43,
    verdictTier: "Effort visible",
    oneLiner: "you're trying. bless.",
    roastParagraph: "Okay, honey. We have a porch. We have three petunias in a plastic pot from the hardware store. We have a welcome mat that's been through a divorce. This is what we're working with, and I'm not mad — I'm disappointed. The bones are fine. The execution is 'I gave up in June.' Let's fix it.",
    fixes: [
      { title: "Replace that pot", detail: "Terracotta or matte black, minimum 18 inches. Plastic is for leftovers, not plants." },
      { title: "Add height", detail: "One thriller plant (canna, purple fountain grass) changes the entire front of your house." },
      { title: "Pick a color story", detail: "Three colors. Not seven. Your porch is not a clearance rack." }
    ],
    recommendedCollection: {
      name: "The Front Porch",
      tier: "Classic",
      whyThisOne: "You have a porch, full sun, zero time. This is the one that makes you look like you have your life together."
    },
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12 md:mt-20 px-4">
      <p className="font-accent text-[--hot-coral] text-center text-base md:text-lg mb-4">a recent victim:</p>
      <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 border border-[--bev-green]/10">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display text-xl font-bold"
            style={{ backgroundColor: "var(--hot-coral)" }}
          >
            {sampleData.score}
          </div>
          <div>
            <h4 className="font-display text-lg text-[--potting-soil]">{sampleData.verdictTier}</h4>
            <p className="font-accent text-[--potting-soil]/60">{sampleData.oneLiner}</p>
          </div>
        </div>
        <p className="font-body text-sm text-[--potting-soil]/80 leading-relaxed line-clamp-3">
          {sampleData.roastParagraph}
        </p>
      </div>
    </div>
  );
}

// Loading Component
function LoadingState() {
  const [quipIndex, setQuipIndex] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setQuipIndex((prev) => (prev + 1) % LOADING_QUIPS.length);
    }, 1500);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[--bev-green] animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-[--bev-green] animate-ping opacity-20" />
      </div>
      <p className="font-accent text-2xl md:text-3xl text-[--potting-soil] mt-8 text-center animate-fade-in">
        {LOADING_QUIPS[quipIndex]}
      </p>
    </div>
  );
}

// Upload Zone Component
function UploadZone({
  onUpload,
  isLoading
}: {
  onUpload: (file: File) => void;
  isLoading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 px-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-3 border-dashed rounded-2xl p-8 md:p-10 text-center cursor-pointer transition-all
          ${isDragging
            ? "border-[--garden-dark] bg-[--bev-green]/10 scale-105"
            : "border-[--bev-green] bg-[--mint-wash] hover:bg-[--bev-green]/10"
          }
          ${preview ? "border-solid border-[--bev-green]" : ""}
        `}
        style={{ borderWidth: "3px" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Selected yard"
              className="max-h-48 mx-auto rounded-xl object-cover"
            />
            <p className="font-accent text-[--bev-green] text-base">tap to change photo</p>
          </div>
        ) : (
          <>
            <div className="text-4xl md:text-5xl mb-3">📸</div>
            <p className="font-display text-lg md:text-xl text-[--potting-soil]">Drop a photo here</p>
            <p className="font-accent text-[--bev-green] text-base">or tap to upload from your phone</p>
          </>
        )}
      </div>

      {/* ZIP Code Input */}
      <div className="text-center">
        <label className="font-accent text-sm text-[--potting-soil]/60 block mb-2">
          so bev knows your zone (optional)
        </label>
        <input
          type="text"
          placeholder="ZIP code"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          maxLength={5}
          className="w-32 px-4 py-2 rounded-full border border-[--bev-green]/30 text-center font-body text-sm focus:border-[--bev-green] focus:outline-none"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
        className={`
          w-full py-4 rounded-full font-body text-base transition-all
          ${selectedFile && !isLoading
            ? "bg-[--potting-soil] text-white hover:bg-[--garden-dark]"
            : "bg-[--potting-soil]/30 text-white/50 cursor-not-allowed"
          }
        `}
      >
        {isLoading ? "🌱 Analyzing..." : "Roast my yard →"}
      </button>

      {/* Warning */}
      <p className="font-accent text-[--hot-coral] text-center text-sm md:text-base">
        (the results may wound your ego. they'll definitely help your curb appeal.)
      </p>
    </div>
  );
}

// Main App Component
export default function App() {
  const [state, setState] = useState<"idle" | "loading" | "result">("idle");
  const [result, setResult] = useState<{
    score: number | null;
    verdictTier: string;
    oneLiner: string;
    roastParagraph: string;
    fixes: Array<{ title: string; detail: string }>;
    recommendedCollection: { name: string; tier: string; whyThisOne: string } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeYard = useAction(api.roasts.analyzeYard);

  const handleUpload = async (file: File) => {
    setState("loading");
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      const roastResult = await analyzeYard({ imageBase64 });

      setResult({
        score: roastResult.score,
        verdictTier: roastResult.verdictTier,
        oneLiner: roastResult.oneLiner,
        roastParagraph: roastResult.roastParagraph,
        fixes: roastResult.fixes,
        recommendedCollection: roastResult.recommendedCollection,
      });
      setState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Bev is taking a nap.");
      setState("idle");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[--clean-white] relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-20 -left-32 w-64 h-64 md:w-96 md:h-96 rounded-full bg-[--bev-green] opacity-10 blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-64 h-64 md:w-96 md:h-96 rounded-full bg-[--sunshine] opacity-10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] rounded-full bg-[--hot-coral] opacity-5 blur-3xl" />

      {/* Auth Section */}
      <AuthSection />

      {/* Main Content */}
      <main className="relative z-10 py-12 md:py-20 px-4">
        {state === "loading" ? (
          <LoadingState />
        ) : state === "result" && result ? (
          <RoastResult result={result} onReset={handleReset} />
        ) : (
          <>
            {/* Hero */}
            <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
              <p className="font-accent text-[--hot-coral] text-lg md:text-xl mb-3 md:mb-4">
                a free tool from bev's garden co
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-[--potting-soil] mb-4 md:mb-6 leading-tight">
                Does your yard pass the{" "}
                <span className="font-accent text-[--bev-green]">Bev Test</span>?
              </h1>
              <p className="font-body text-base md:text-lg text-[--potting-soil]/70 max-w-xl mx-auto">
                Upload a photo. Bev will tell you — honestly, and with her full chest — what's wrong with it. And how to fix it.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="max-w-lg mx-auto mb-6 p-4 bg-[--hot-coral]/10 border border-[--hot-coral] rounded-xl text-center">
                <p className="font-accent text-[--hot-coral]">{error}</p>
              </div>
            )}

            {/* Upload Zone */}
            <UploadZone onUpload={handleUpload} isLoading={false} />

            {/* Sample Roast */}
            <SampleRoast />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <p className="font-body text-xs text-[--potting-soil]/40">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
