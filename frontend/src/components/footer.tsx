export function Footer() {
  return (
    <footer className="border-t border-black pt-16 pb-10">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        {/** OUR MISSION | LEGAL */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-14">
          <div className="max-w-md">
            <p className="bold pb-2">OUR MISSION</p>
            <p className="text-sm font-light tracking-widest max-w-2xs">
              Turning DeFi complexity into conversation.
            </p>
          </div>
          <div className="flex flex-col items-end text-right">
            <p className="bold pb-2">LEGAL</p>
            <p className="max-w-2xs text-sm font-light tracking-widest">
              Aiwal is experimental software. Use at your own risk. Nothing on
              this platform constitutes financial advice.
            </p>
          </div>
        </div>
        {/** LEGAL LINKS */}
        <div className="mt-32 text-center">
          <div className="grid grid-cols-5 max-w-lg mx-auto text-sm">
            <a href="https://github.com/aiwal">GitHub</a>
            <span>·</span>
            <a href="/terms">Terms of Service</a>
            <span>·</span>
            <a href="/privacy">Privacy Policy</a>
          </div>
          <p className="mt-8 text-xs font-medium tracking-widest uppercase">
            © 2026 Aiwal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
