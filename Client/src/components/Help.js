import React from "react";

export default class Help extends React.Component {
  render() {
    return (
      <div className="ui container">
        <div style={{ marginTop: "20px" }} className="ui segment">
          <h1>Help</h1>
          <p>This App suggests a Simple search engine.
          in order to start a new search, click on the App logo or on the search button on the upper right hand side

          </p>
          <h3>
            Search options
          </h3>
          <p>
            <ul>
              <b>Simple search-</b>
              <li> type a word or words to search, separated by "Space" characters, and click the search button, or the 'Enter' key in the keyboard</li>
            </ul>

            <ul>
              <b>Advanced search-</b>
              <li>Use the & (And), | (OR), ! (NOT) characters, in order to filter the results.
              ! can not appear first in a sentence, and all the characters can be combined, with or without one level of parenthesis.
              </li>
              <li>Use the Soundex slider in order to search by Soundex code, which helps searching words you are not sure about their spelling.</li>
            </ul>
          </p>
          <h3>
            Search examples
          </h3>
          <p>
            <ul>
              <li>Information- will yield all documents contain information</li>
              <li>Information & Retrival- will yield all documents contain information and retrival</li>
              <li>Information | Retrival- will yield all documents contain either information or retrival, or both</li>
              <li>Information & !Retrival- will yield all documents contain information but not contain retrival</li>
            </ul>
          </p>
          <h3>
            Admin
          </h3>
          <p>
            An admin user has permissions for several system operations
              <ul>
              <li>Upload new zip folder to the application, each folder contains desired files to upload, which will all be indexed at once</li>
              <li>View all files in the system.</li>
              <li>Activate/Deactivate file by pressing the button in thr 'View Documents' panel. the caption on the button indicates the documents current status.
                deactivated files will not appear in searches, even if they are relevant to the search
              </li>
            </ul>
          </p>
        </div>
      </div>
    );
  }
}
