import { Button } from "@mui/material";
import Link from "next/link";

const HomePage = () => {

  return (
    <>
      <h1>Welcome To Homepage</h1>
      <Link href="dashboard/server-page">
        <Button variant="contained">Server Side Page</Button>
      </Link>
      <Link href="dashboard/client-page">
        <Button variant="contained">Client Side Page</Button>
      </Link>
    </>
  )
}

export default HomePage;