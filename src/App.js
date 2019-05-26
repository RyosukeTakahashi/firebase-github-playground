import React, {Component} from 'react';
import './App.css';

import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';

import Button from '@material-ui/core/Button';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const firebaseConfig = {
  apiKey: 'AIzaSyBcR5PBPtOcyYQsAynwiMGMi53hYGiRdFw',
  authDomain: 'fir-github-playground.firebaseapp.com',
  databaseURL: 'https://fir-github-playground.firebaseio.com',
  projectId: 'firebase-github-playground',
  storageBucket: 'firebase-github-playground.appspot.com',
  messagingSenderId: '210895001319',
  appId: '1:210895001319:web:82f0e443118a65bc',
};

const provider = new firebase.auth.GithubAuthProvider();
provider.addScope('repo');

firebase.initializeApp(firebaseConfig);

class App extends Component {

  state = {allCommitMessages: ''};

  getActivities = async () => {
    const options = {
      headers: {'Authorization': `token ${this.state.ghToken}`},
    };
    const res = await axios.get(
      `https://api.github.com/users/${this.state.userName}/events`, options);
    const data = await res.data;
    await this.setState({data});
  };


  generatePushCommitString = () => {

    const pushEvents = this.state.data.filter(
      activity => activity.type === 'PushEvent' &&
        activity.repo.name.includes('intellij') === false,
    ).map((pushEvent) => {

      const pushAndCommitsStr = ` - ${pushEvent.repo.name}
${pushEvent.payload.commits.map(commit => `  - ${commit.message}`).join('\n')}
`;
      return pushAndCommitsStr;

    }).join('\n');

    this.setState({allCommitMessages: pushEvents, loading: false});

  };

  handleLoginClick = async () => {

    await this.setState({loading: true, allCommitMessages: "...Logging in getting your recent commits."});

    const result = await firebase.auth()
      .signInWithPopup(provider)
      .then(async function(result) {
        return result;
      })
      .catch(function(error) {
        // Handle Errors here.
        const errorCode = error.code;
        console.log(errorCode);
        const errorMessage = error.message;
        console.log(errorMessage);
        // The email of the user's account used.
        const email = error.email;
        console.log(email);
        // The firebase.auth.AuthCredential type that was used.
        const credential = error.credential;
        console.log(credential);
        // ...
      });

    const userData = {
      ghToken: result.credential.accessToken,
      userName: result.additionalUserInfo.username,
    };
    await this.setState(userData, async () => {
      await this.getActivities();
      await this.generatePushCommitString();
    });

  };

  render() {

    return (
      <div className="App">
        <p>
          What did you commit recently?
        </p>
        <div className="login-button">
          <Button onClick={this.handleLoginClick} disabled={this.state.loading}
                  color={'primary'} variant={'contained'}>Login by
            GitHub</Button>
        </div>

        <div className="copy-button">
          <CopyToClipboard text={this.state.allCommitMessages}
                           onCopy={() => this.setState({copied: true})}>
            <Button disabled={this.state.allCommitMessages.includes('-') === false}
                    variant={'contained'}>Copy Commits to Clipboard</Button>
          </CopyToClipboard>
        </div>

        <textarea name="" id="" cols="50" rows="20"
                  value={this.state.allCommitMessages} readOnly>
        </textarea>

        {this.state.copied &&
        <div>
          Copied !!
        </div>}

      </div>
    );
  }
}

export default App;
