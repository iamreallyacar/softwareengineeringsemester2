import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import SmartHomes from './components/SmartHomes';

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/" exact component={Login} />
                <Route path="/create-account" component={CreateAccount} />
                <Route path="/smart-homes" component={SmartHomes} />
            </Switch>
        </Router>
    );
}

export default App;