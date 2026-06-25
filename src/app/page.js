import { Suspense } from "react";
import Login from "./Login";

export default function Page() {
  console.log('dev env')
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
