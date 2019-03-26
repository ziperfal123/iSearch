import React from "react";
import { Route, Link } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import Upload from "./Upload";
import View from "./View";
import Login from "./Login";

export default class Admin extends React.Component {
  state = { activeItem: "Upload Documents", isConnected: false };

  handleItemClick = (e, { name }) => this.setState({ activeItem: name });

  isLogedIn = (e) => {
    if (e === `true`)
      this.setState({ isConnected: true })
  }

  render() {
    const { activeItem } = this.state;

    if (!this.state.isConnected)
      return <Login isLogedIn={this.isLogedIn} />
    else {
      return (
        <div className="ui grid" style={componentStyle}>
          <div className="four wide column" style={{ paddingLeft: 50 }}>
            <Menu secondary vertical>
              <Menu.Item
                name="Upload Documents"
                active={activeItem === "Upload Documents"}
                onClick={this.handleItemClick}
                as={Link}
                to={`/admin/Upload-documents`}
              />
              <Menu.Item
                name="View Documents"
                active={activeItem === "View Documents"}
                onClick={this.handleItemClick}
                as={Link}
                to={`/admin/View-documents`}
              />
            </Menu>
          </div>
          <div className="twelve wide column" style={{ paddingRight: 200 }}>
            <Route path={`/admin/View-documents`} component={View} />
            <Route path={`/admin/Upload-documents`} component={Upload} />
          </div>
        </div>
      );
    }
  }
}

const componentStyle = {
  marginTop: 20
};
