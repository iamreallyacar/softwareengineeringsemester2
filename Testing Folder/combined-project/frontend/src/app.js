import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// Lazy load components
const Login = lazy(() => import('./components/Login'));
const CreateAccount = lazy(() => import('./components/CreateAccount'));
const SmartHomes = lazy(() => import('./components/SmartHomes'));

function App() {
    return (
        <Router>
            <Suspense fallback={<div>Loading...</div>}>
                <Switch>
                    <Route path="/" exact component={Login} />
                    <Route path="/create-account" component={CreateAccount} />
                    <Route path="/smart-homes" component={SmartHomes} />
                </Switch>
            </Suspense>
        </Router>
    );
}

export default App;