import { AppRegistry } from 'react-native';
import App from './App';
import appName from './app.json';

AppRegistry.registerComponent(appName.name, () => App);
AppRegistry.runApplication(appName.name, {
    initialProps: {},
    rootTag: document.getElementById('root'),
});
