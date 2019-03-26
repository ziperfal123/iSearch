import React, { Component } from "react";
import axios from "axios";
import Document from "./Document";
import DocumentContent from "./DocumentContent";
import "../style/search.css";

export default class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSoundexActivated: false,
      dataIsFetched: false,
      termToSearch: "",
      documents: [],
      documentsNumber: null,
      selectedDocument: null
    };

    this.renderNormalSearch = this.renderNormalSearch.bind(this);
    this.renderFetchedData = this.renderFetchedData.bind(this);
  }

  handleInputChange = e => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;

    this.setState({
      isSoundexActivated: value
    });
  };

  addDocument = ({ author, title, description, documentNumber, isActive }) => {
    this.setState(prevState => ({
      documents: [
        ...prevState.documents,
        {
          author: author,
          title: title,
          description: description,
          documentNumber: documentNumber,
          isActive: isActive
        }
      ]
    }));
  };

  HandleSearch = async e => {
    e.preventDefault();
    this.setState({ documents: [] });

    let query = this.query.value;
    let soundex = this.state.isSoundexActivated;
    this.setState({ termToSearch: query });

    const data = new FormData();
    data.append("query", query);
    data.append("soundex", soundex);

    await axios
      .post(`https://ir-search.herokuapp.com/search`, data)
      .then(res => {
        res.data.map(item => {
          this.addDocument({
            author: item.author,
            title: item.title,
            description: item.description,
            documentNumber: item.documentNumber,
            isActive: item.isActive
          });
        });
        return res.data;
      })
      .then(res => this.setState({ dataIsFetched: true, documentsNumber: res.length }))
  };

  eachDocument = (item, i) => {
    return <Document query={this.state.termToSearch} item={item} key={i} onDocumentSelect={this.onDocumentSelect} withButton={`false`} />;
  };

  renderNormalSearch() {
    return (
      <div className="generalStyle">
        <h1 className="heading">Search</h1>
        <form onSubmit={this.HandleSearch}>
          <div className="input ui fluid icon input">
            <input type="text" ref={input => (this.query = input)} />
            <i className="search icon" />
          </div>

          <div className="searchBtnNormal">
            <label className="switchNormal">
              <input className="inputNormal" name="Soundex" type="checkbox" checked={this.state.isSoundexActivated} onChange={this.handleInputChange} />
              <div className="slider round" />
            </label>
            <h5 style={{ marginTop: 10 }}>Use Soundex</h5>
            <button className="ui button" style={{ marginTop: 15, marginRight: 0 }}>
              Search
            </button>
          </div>
        </form>
      </div>
    );
  }

  renderFetchedData() {
    if (this.state.documentsNumber !== 0) {
      return (
        <div>
          <form style={{ display: "flex", flexDirection: "row" }} onSubmit={this.HandleSearch}>
            <div style={leftSeachStyle}>
              <div className="ui fluid icon input" style={{ width: "95%" }}>
                <input type="text" ref={input => (this.query = input)} />
                <i className="search icon" />
              </div>
            </div>

            <div className="searchBtnData">
              <label className="switchNormal">
                <input className="inputNormal" name="Soundex" type="checkbox" checked={this.state.isSoundexActivated} onChange={this.handleInputChange} />
                <div style={{ marginLeft: 30 }} className="slider round" />
              </label>
              <h5 style={{ position: "relative", top: 25, right: 35 }}>Use Soundex</h5>
              <button style={{ marginTop: 30, marginRight: 0 }} className="ui button" >
                Search
              </button>
            </div>

          </form>

          <div style={documentStyle}>
            {this.state.documents.map(this.eachDocument)}
          </div>

        </div>
      );
    }
    else if (this.state.documentsNumber === 0) {
      return (
        <div>
          <form style={{ display: "flex", flexDirection: "row" }} onSubmit={this.HandleSearch}>
            <div style={leftSeachStyle}>
              <div className="ui fluid icon input" style={{ width: "95%" }}>
                <input type="text" ref={input => (this.query = input)} />
                <i className="search icon" />
              </div>
            </div>

            <div className="searchBtnData">
              <label className="switchNormal">
                <input className="inputNormal" name="Soundex" type="checkbox" checked={this.state.isSoundexActivated} onChange={this.handleInputChange} />
                <div style={{ marginLeft: 30 }} className="slider round" />
              </label>
              <h5 style={{ position: "relative", top: 25, right: 35 }}>Use Soundex</h5>
              <button style={{ marginTop: 30, marginRight: 0 }} className="ui button" >
                Search
              </button>
            </div>

          </form>
          <div style={notFoundMessageStyle}>
            <h2>No documents found for '{this.state.termToSearch}' </h2>
            <h3>Please try again</h3>
          </div>
        </div>
      );
    }
  }

  onDocumentSelect = documentNumber => {
    this.setState({ selectedDocument: documentNumber });
  };

  onBack = () => {
    this.setState({ selectedDocument: null });
  };

  render() {
    if (!this.state.dataIsFetched) {
      return this.renderNormalSearch();
    }
    else {
      if (this.state.selectedDocument) {
        return (
          <div style={{ width: "fit-content", margin: "30px auto" }}>
            <DocumentContent inSearch={`true`} query={this.state.termToSearch} documentNumber={this.state.selectedDocument} onBack={this.onBack}
            />
          </div>)
      }
      else return this.renderFetchedData();
    }
  }
}

/* Styles -> renderFetchedData() */

const documentStyle = {
  position: "relative",
  width: "65%",
  margin: "40px auto"
};

const leftSeachStyle = {
  width: "40%",
  marginTop: 30,
  marginLeft: 30
};

const notFoundMessageStyle = {
  marginLeft: 45,
  marginTop: 35
};
