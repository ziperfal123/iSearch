import React, { Component } from "react";
import Highlighter from "react-highlight-words";

export default class DocumentContent extends Component {
  state = { content: "" };

  componentDidMount() {
    const url = `https://ir-search.herokuapp.com/getDocumentContent?fileNumber=${
      this.props.documentNumber
      }`;
    fetch(url)
      .then(response => {
        return response.json();
      })
      .then(data => {
        this.setState({ content: data });
      })
      .catch(err => console.log(err));
  }

  splitMulti = (str, tokens) => {
    var tempChar = tokens[0];
    for (var i = 1; i < tokens.length; i++) {
      str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
  };

  render() {
    if (this.props.inSearch === `true`) {
      let content = this.state.content;
      let query = this.props.query;

      query = this.splitMulti(query, [` `, `-`, `&`, `|`, `(`, `)`, `!`]);
      return (
        <div>
          <button onClick={this.props.onBack}>
            <i className="arrow left icon" />
          </button>
          <button style={{ marginLeft: 20 }} onClick={() => window.print()}>
            <i className="print icon"></i>
          </button>
          <pre><Highlighter
            searchWords={query}
            textToHighlight={content}
          /></pre>
        </div>
      );
    }
    else {
      return (
        <div>
          <button onClick={this.props.onBack}>
            <i className="arrow left icon" />
          </button>
          <button style={{ marginLeft: 20 }} onClick={() => window.print()}>
            <i className="print icon"></i>
          </button>
          <pre>{this.state.content}</pre>
        </div>
      );
    }
  }
}
