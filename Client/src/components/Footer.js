import React from "react";

export default class Footer extends React.Component {
  render() {
    return (
      <div style={footerStyle}>
        <h4 style={lineStyle}>
          This project was made as part of Information Retrievel Course in
          Shenkar
        </h4>
        <h4 style={lineStyle}>Made by: Amit Levy & Yaniv Ziperfal</h4>
      </div>
    );
  }
}

const footerStyle = {
  position: "fixed",
  left: "0",
  bottom: "0",
  height: "80px",
  width: "100%",
  fontSize: 15,
  backgroundColor: "#129472"
};

const lineStyle = {
  marginTop: 15,
  marginLeft: 20,
  fontSize: 15,
  color: "#ffffff"
};
