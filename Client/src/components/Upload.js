import React, { Component } from "react";
import axios from "axios";

export default class Upload extends Component {
  state = {
    selectedFile: null,
    showWarning: `hidden`,
    filesUploaded: false

  };

  fileSelectedHandler = uploadedFile => {
    if (uploadedFile.target.files[0].type !== `application/zip`)
      this.setState({ showWarning: `visible` });
    else
      this.setState({ selectedFile: uploadedFile.target.files[0] });
  };

  fileUploadeHanled = e => {
    e.preventDefault();

    const data = new FormData();
    data.append("file", this.state.selectedFile);

    axios
      .post(`https://ir-search.herokuapp.com/upload`, data)
      .then(this.setState({ filesUploaded: true }));

  };

  onClose = () => {
    this.setState({ filesUploaded: false })
  }


  render() {
    if (!this.state.filesUploaded) {
      return (
        <div style={{ width: "70%", textAlign: "center" }} className="ui container">
          <div className="ui segment">
            <h2>Upload Files</h2>
            <form style={{ alignItems: "center", display: "flex", flexDirection: "column" }} className="ui form" onSubmit={this.fileUploadeHanled}>
              <div className="field">
                <input style={{ width: "100%" }} id="input" type="file" onChange={this.fileSelectedHandler} />
              </div>
              <button className="ui button">Upload</button>

            </form>
            <div style={{ visibility: `${this.state.showWarning}`, margin: "10px auto", width: "70%" }} className="ui bottom attached warning message">
              <i className="warning icon"></i>
              File must be of type zip
          </div>
            <h5>For your attention- We only allow uploading zip files</h5>
          </div>
        </div>
      );
    }
    else {
      return (
        <div className="ui success message">
          <i className="close icon" onClick={this.onClose}></i>
          <div className="header">
            Files Uploaded Successfuly!
          </div>
        </div>
      );



    }
  }
}
