import { Nunito_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "../icons.css";
import MemberInfoPopup from "@/_components/MemberInfoPopup";
import VendorNotePopup from "@/_components/VendorNotePopup";
import GlobalLoader from "@/_components/GlobalLoader";
import Providers from "./providers";
import GlobalToast from "@/_components/UI/GlobalToast";
import favicon from "@/assets/logo/favicon.png";

const nunito_sans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

const mencken = localFont({
  src: "../assets/fonts/MenckenStd.otf",
  variable: "--font-mencken",
  weight: "100 900",
  display: "swap",
});

export const metadata = {
  title: "Smart Networks",
  description: "Smart Networks – manage events, actionables, members and expenses for your network.",
  icons: {
    icon: favicon.src,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F7FF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${nunito_sans.variable} ${mencken.variable} antialiased relative`}
        suppressHydrationWarning
      >
        <Providers>
          <MemberInfoPopup />
          {children}
          <VendorNotePopup />
          <GlobalLoader />
          <GlobalToast/>
        </Providers>
      </body>
    </html>
  );
}
