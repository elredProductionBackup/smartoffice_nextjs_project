import { Suspense } from "react";
import Login from "./Login";

export default function Page() {
  console.log("main branch console")
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
