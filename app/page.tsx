import { photos } from "@/lib/catalogue";
import Store from "./store";

export default function Home() {
  return <Store photos={photos} />;
}
