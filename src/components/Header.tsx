import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, UserCog } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Wallet XChanger
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <UserCog className="h-5 w-5" />
                <span className="sr-only">Admin Dashboard</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
