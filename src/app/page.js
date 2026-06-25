import { Suspense } from "react";
import Login from "./Login";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
