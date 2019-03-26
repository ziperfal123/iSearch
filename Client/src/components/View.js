import React from "react";
import Document from "./Document";
import DocumentContent from "./DocumentContent";

export default class View extends React.Component {
  state = {
    isLoading: true,
    selectedDocument: null,
    documents: []
  };

  add = ({ author, title, description, documentNumber, isActive }) => {
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

  componentDidMount() {
    const url = `https://ir-search.herokuapp.com/getAllDocumentsData`;
    fetch(url)
      .then(response => {
        return response.json();
      })
      .then(data =>
        data.map(item =>
          this.add({
            author: item.author,
            title: item.title,
            description: item.description,
            documentNumber: item.documentNumber,
            isActive: item.isActive
          })
        )
      )
      .catch(err => console.log(err));
  }
  eachDocument = (item, i) => {
    return (
      <Document item={item} key={i} onDocumentSelect={this.onDocumentSelect} withButton={`true`} />
    );
  };

  onDocumentSelect = documentNumber => {
    this.setState({ selectedDocument: documentNumber });
  };

  onBack = () => {
    this.setState({ selectedDocument: null });
  };

  render() {
    return this.state.selectedDocument === null ? (
      <div>{this.state.documents.map(this.eachDocument)}</div>
    ) : (
        <DocumentContent
          documentNumber={this.state.selectedDocument}
          onBack={this.onBack}
        />
      );
  }
}
