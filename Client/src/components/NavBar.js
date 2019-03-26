import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../images/logo1.png";

export default class NavBar extends React.Component {
  render() {
    return (
      <div style={navStyle}>
        <a href="/" style={logoStyle} />
        <div style={itemsContainer}>
          <NavLink style={navItem} to="/">
            Search
            <i className="search icon" />
          </NavLink>
          <NavLink style={navItem} exact to="/admin/Upload-documents">
            Admin
            <i className="cog icon" />
          </NavLink>
          <NavLink style={navItem} to="/help">
            Help
            <i className="question circle outline icon" />
          </NavLink>
        </div>
      </div>
    );
  }
}

const navStyle = {
  width: "100%",
  height: 110,
  backgroundColor: "#129472"
};

const logoStyle = {
  width: 70,
  height: 70,
  backgroundImage: `url(${logo})`,
  position: "absolute",
  top: 20,
  left: 35
};

const itemsContainer = {
  width: 300,
  height: "100%",
  float: "right",
  flexDirection: "row",
  backgroundColor: "#129472",
  display: "flex",
  justifyContent: "space-evenly"
};

const navItem = {
  marginTop: 42,
  fontSize: 15,
  color: "#ffffff"
  // justifyContent: 'center'
};
