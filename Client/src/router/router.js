import React from "react";
import { Route } from "react-router-dom";
import NavBar from "../components/NavBar";
import Search from "../components/Search";
import Help from "../components/Help";
import Admin from "../components/Admin";
import Footer from "../components/Footer";

const ReactRouter = () => {
  return (
    <React.Fragment>
      <NavBar />
      <div style={{ overflowY: "auto", overflowX: "hidden", height: "70vh" }}>
        <Route exact path="/" component={Search} />
        <Route path="/help" component={Help} />
        <Route path="/admin" component={Admin} />
      </div>
      <Footer />
    </React.Fragment>
  );
};

export default ReactRouter;
