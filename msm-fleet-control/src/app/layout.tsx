import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";
export const metadata = { title: "MSM Fleet Control", description: "PT Muria Sumba Manis" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>;
}
