import React, { Component } from "react";
import consts from "../consts";

export default class Login extends Component {

    state = {
        showWarning: `hidden`
    }

    loginHandler = (e) => {
        e.preventDefault();

        if ((this.input.value) === consts.Password) {
            this.props.isLogedIn(`true`);
        }

        else {
            this.setState({ showWarning: `visible` })
        }

    }

    render() {
        return (

            <div style={containerStyle} className="ui container ui segment">
                <h1>Login As Admin</h1>
                <form className="ui form" onSubmit={this.loginHandler}>
                    <div className="field">
                        <h3>Password</h3>
                        <input style={inputStyle} ref={input => this.input = input} type="password" name="password" placeholder="Enter your password here"></input>
                    </div>
                    <button className="ui button" type="submit">Login</button>
                </form>
                <div style={{ visibility: `${this.state.showWarning}`, marginTop: 7, width: "95%" }} className="ui bottom attached warning message">
                    <i className="warning icon"></i>
                    Wrong Password, Please try again
                </div>
            </div>
        );
    }
}

const inputStyle = {
    width: "95%",
    textSecurity: "disc"
}

const containerStyle = {
    width: "30%",
    marginTop: "100px"
}
