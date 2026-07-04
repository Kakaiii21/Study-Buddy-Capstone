// src/components/SplashScreen.tsx
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
      <img
        src="./web-app-manifest-512x512.png"
        alt="Study Buddy logo"
        className="w-24 h-24 md:w-32 md:h-32 animate-pulse"
      />
      <p className="mt-4 text-primary-600 font-fustat font-bold text-sm md:text-base">
        Loading Study Buddy...
      </p>
    </div>
  )
}