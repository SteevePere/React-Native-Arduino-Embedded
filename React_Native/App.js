import React, {Component} from 'react';
import SyncStorage from 'sync-storage';
import {
			Platform,
			StyleSheet,
			Text,
			TextInput,
			View,
			Image,
			Button,
			ActivityIndicator,
			DrawerLayoutAndroid,
			ToolbarAndroid,
			StatusBar,
			ScrollView,
			TouchableOpacity,
			Alert,
			TouchableHighlight
		} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import EasyBluetooth from 'easy-bluetooth-classic';
import SendSMS from 'react-native-sms-x';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';


import EmergencyContactsForm from './Components/EmergencyContactsForm';

type Props = {}; // default props


export default class App extends Component <Props> {


    constructor(props) {

        super(props);

        this.state = { // state init
            device: {},
            connected: false,
						connecting: true,
            scanning: false,
            connectionError: false,
            emergencyContacts: [],
						latitude: null,
						longitude: null,
						text: '',
						brakeLight: '',
						recognized: '',
    				pitch: '',
    				error: '',
    				end: '',
    				started: '',
    				results: [],
    				partialResults: [],
						voice : false
        };

        this.initBTConfig = this.initBTConfig.bind(this); // binding methods to class
				this.getEmergencyContacts = this.getEmergencyContacts.bind(this);
				this.saveEmergencyContactsToState = this.saveEmergencyContactsToState.bind(this);
        this.scanDevices = this.scanDevices.bind(this);
        this.connectToDevice = this.connectToDevice.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
				this.onDataRead = this.onDataRead.bind(this);
				this.sendSMSToEmergencyContacts = this.sendSMSToEmergencyContacts.bind(this);
				this.brakeToggled = this.brakeToggled.bind(this);

				Voice.onSpeechStart = this.onSpeechStart;
    		Voice.onSpeechRecognized = this.onSpeechRecognized;
    		Voice.onSpeechEnd = this.onSpeechEnd;
    		Voice.onSpeechError = this.onSpeechError;
    		Voice.onSpeechResults = this.onSpeechResults;
    		Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    		Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged;

				this.getEmergencyContacts();
    }


    componentWillMount() { // first event in lifecylce

		Tts.getInitStatus().then(() => {
			Tts.setDefaultLanguage('fr_FR');
	    	Tts.setDefaultPitch(1.5);
		}).catch(error => {
			console.log(error);
		})

        this.initBTConfig();
    	this.onDataReadEvent = EasyBluetooth.addOnDataReadListener(this.onDataRead.bind(this));

		navigator.geolocation.getCurrentPosition((position) => {

				this.setState({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			(error) => {console.log(error)},
			{timeout: 5000},
		);
    }


    async componentDidMount() { // second event in lifecycle

        const storedData = await SyncStorage.init();
        const device = await SyncStorage.get('device'); // attempting to retrieve device from local storage

        if (device) {

			this.setState({ // this allows for conditional rendering (loading spinner, etc)
	            device: device
	        });

            this.connectToDevice(device);
        }

        else {
            this.scanDevices(); // scanning for discoverable BT devices in range
        }

    }


	componentWillUnmount() { // method called at end of lifecycle
		this.onDataReadEvent.remove();
		Voice.destroy().then(Voice.removeAllListeners);
	}


	onSpeechStart = e => {
    // eslint-disable-next-line
    console.log('onSpeechStart: ', e);
    this.setState({
      started: '√',
    });
  };

  onSpeechRecognized = e => {
    // eslint-disable-next-line
    console.log('onSpeechRecognized: ', e);
    this.setState({
      recognized: '√',
    });
  };

  onSpeechEnd = e => {
    // eslint-disable-next-line
    console.log('onSpeechEnd: ', e);
    this.setState({
      end: '√',
    });
  };

  onSpeechError = e => {
    // eslint-disable-next-line
    console.log('onSpeechError: ', e);
    this.setState({
      error: JSON.stringify(e.error),
    });
  };

  onSpeechResults = e => {
    // eslint-disable-next-line
    console.log('onSpeechResults: ', e);
    this.setState({
      results: e.value,
    });
  };

  onSpeechPartialResults = e => {
    // eslint-disable-next-line
    console.log('onSpeechPartialResults: ', e);
    this.setState({
      partialResults: e.value,
    });
  };

  onSpeechVolumeChanged = e => {
    // eslint-disable-next-line
    console.log('onSpeechVolumeChanged: ', e);
    this.setState({
      pitch: e.value,
    });
  };

  _startRecognizing = async () => {
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
    });

    try {
      await Voice.start('fr-FR');
    } catch (e) {
      //eslint-disable-next-line
      console.error(e);
    }
  };

  _stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      //eslint-disable-next-line
      console.error(e);
    }
  };

  _cancelRecognizing = async () => {
    try {
      await Voice.cancel();
    } catch (e) {
      //eslint-disable-next-line
      console.error(e);
    }
  };

  _destroyRecognizer = async () => {
    try {
      await Voice.destroy();
    } catch (e) {
      //eslint-disable-next-line
      console.error(e);
    }
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
    });
  };

    initBTConfig() { // needed for BlueTooth operation

        var config = { // do not change (except name)
            "uuid": "00001101-0000-1000-8000-00805f9b34fb",
            "deviceName": "KSH APP",
            "bufferSize": 1024,
            "characterDelimiter": "\n"
        }

        EasyBluetooth.init(config).then(function (config) {

        }).catch(function (e) {

            console.log(e);
        });
    }


	async getEmergencyContacts() { // get contacts saved in storage

		const contactsArray = [];
		const storedData = await SyncStorage.init();

		const emergencyContact1 = await SyncStorage.get('emergencyContact1');
		const emergencyContact2 = await SyncStorage.get('emergencyContact2');
		const emergencyContact3 = await SyncStorage.get('emergencyContact3');

		contactsArray.push(
			emergencyContact1,
			emergencyContact2,
			emergencyContact3
		);

		this.saveEmergencyContactsToState(contactsArray);

		return contactsArray;
	}


	saveEmergencyContactsToState(emergencyContacts) {

		this.setState({emergencyContacts: emergencyContacts});
	}


    scanDevices() { // scans BT devices in range (and discoverable)

        this.setState({ // this allows for conditional rendering (loading spinner, etc)
            connected: false,
						connectionError: false,
            scanning: true
        });

        console.log("Scanning for discoverable Bluetooth devices...");

        EasyBluetooth.startScan().then(function (devices) { // devices is an array of device objects

            for (var i = 0, len = devices.length; i < len; i++) {

                if (devices[i].address === "00:14:03:06:09:DA") { // helmet MAC address

					console.log("Helmet found");

					EasyBluetooth.stopScan();

					this.setState({
						connecting: true,
					});

                    this.connectToDevice(devices[i]);

                    return;
                }
            }

            this.setState({
                scanning: false,
            });

        }.bind(this)); // binding callback function to class, allows state access
	}


    connectToDevice(device) { // connects to (any) device

        EasyBluetooth.connect(device).then(() => {

            this.setState({
                scanning: false,
				connecting: false,
				connectionError: false,
                connected: true
            });

			SyncStorage.set('device', device); // overwriting previous local storage helmet device

			console.log("Connected to device");

        }).catch((e) => {

            console.log(e);

            this.setState({
                scanning: false,
				connecting: false,
                connectionError: true,
				connected: false
            });
        });
    }


    sendMessage(message) { // send message (to helmet only)

        EasyBluetooth.writeln(message).then(() => {

            console.log("Message sent to helmet");

        }).catch((e) => {

            console.log(e);
        });
    }


	onDataRead(data) { // event listener

		console.log(data);

		if (data.trim() == "je suis un choc") {

			Tts.getInitStatus().then(() => {
				Tts.speak("Choque détecté, envoi des messages en cours"); // typo is intentional, 'choc' sounds weird...
			}).catch(error => {
				console.log(error);
			})

    		this.sendSMSToEmergencyContacts(
				"!!!SOS!!! J'ai eu un accident en moto, j'ai besoin des secours. Voici ma position : "
				+ this.state.latitude
				+ ", "
				+ this.state.longitude
			);
		}

		else if (data.trim() == "frein activer") {

			this.setState({
				brakeLight: "On.",
			}, () => {

				this.brakeToggled();
			});
		}

		else if (data.trim() == "frein desactiver") {

			this.setState({
				brakeLight: "Off.",
			}, () => {

				this.brakeToggled();
			});
		}
	}


	sendSMSToEmergencyContacts(messageText) { // sends text message to users stored in app storage

		this.state.emergencyContacts.map(function (emergencyContact) {

			console.log("Sending SMS to " + emergencyContact.name + "...");
			SendSMS.send(123, emergencyContact.phoneNumber, messageText, (msg)=>{});
		});
	}


	async onActionSelected(position) {

		if (position === 0) {

			this.setState({
				connectionError: false,
				connecting: true,
				connected: false
			}, () => {
				this.connectToDevice(this.state.device);
			});
		}

		if (position === 1) {

			this.setState(prevState => ({
  			voice: !prevState.voice

			}));

		}
	}


	openDrawer() {

		this.refs['DRAWER'].openDrawer();
	}


	brakeToggled() {

		Alert.alert(
			"Brake Light Has Been Toggled " + this.state.brakeLight,
			"Please confirm that this is intentional.",
			[
				{ text: "OK", onPress: () => console.log("OK Pressed") }
			],
			{ cancelable: false }
		);
	};


    render() { // renders view

		const connected = "Connected to Kosmos Smart Helmet";
		const connectionError = "Unable to connect to your Kosmos Smart Helmet";

		var drawer = (
			<View style={{flex: 1, backgroundColor: '#fff'}}>

				<EmergencyContactsForm
					getEmergencyContacts={this.getEmergencyContacts}
					saveEmergencyContactsToParentState={this.saveEmergencyContactsToState}
				/>

			</View>
		);

        return (

			<DrawerLayoutAndroid
				ref={'DRAWER'}
				drawerWidth={300}
				drawerPosition={DrawerLayoutAndroid.positions.Left}
				renderNavigationView={() => drawer}
			>

            <View style={styles.container}>

				<StatusBar backgroundColor="#c62726" barStyle="light-content"/>

				<Icon.ToolbarAndroid
					navIconName='md-menu'
					onIconClicked={this.openDrawer.bind(this)}
					title="KSH"
					titleColor="white"
					style={styles.toolbar}
      				actions={toolbarActions}
      				onActionSelected={this.onActionSelected.bind(this)}
				/>

				{!this.state.voice &&
				<Image source={require('./assets/images/background.png')} style={styles.backgroundImage} />
				}
				{this.state.voice &&
					<View style={styles.container}>
        <Text style={styles.instructions}>Press the button and start speaking.</Text>
        <Text style={styles.stat}>{`Started: ${this.state.started}`}</Text>
        <Text style={styles.stat}>{`Recognized: ${this.state.recognized}`}</Text>
        <Text style={styles.stat}>{`Pitch: ${this.state.pitch}`}</Text>
        <Text style={styles.stat}>{`Error: ${this.state.error}`}</Text>
        <Text style={styles.stat}>Results</Text>
        {this.state.results.map((result, index) => {
          return (
            <Text key={`result-${index}`} style={styles.stat}>
              {result}
            </Text>
          );
        })}
        <Text style={styles.stat}>Partial Results</Text>
        {this.state.partialResults.map((result, index) => {
          return (
            <Text key={`partial-result-${index}`} style={styles.stat}>
              {result}
            </Text>
          );
        })}
        <Text style={styles.stat}>{`End: ${this.state.end}`}</Text>
        <TouchableHighlight onPress={this._startRecognizing}>
          <Image style={styles.button} source={require('./button.png')} />
        </TouchableHighlight>
        <TouchableHighlight onPress={this._stopRecognizing}>
          <Text style={styles.action}>Stop Recognizing</Text>
        </TouchableHighlight>
        <TouchableHighlight onPress={this._cancelRecognizing}>
          <Text style={styles.action}>Cancel</Text>
        </TouchableHighlight>
        <TouchableHighlight onPress={this._destroyRecognizer}>
          <Text style={styles.action}>Destroy</Text>
        </TouchableHighlight>
      </View>
				}
				{this.state.connecting && // if we're scanning, show spinner
                    <ActivityIndicator
						size={50}
						color="#fff"
						style={styles.connected}
					 />
                }
				{!this.state.connecting && !this.state.voice &&
                    <Text style={styles.connected}>
                        {this.state.connected ? connected : connectionError}
                    </Text>
				}
				<Icon
					name="md-switch"
					size={60}
					color={this.state.brakeLight === "On." ? "#db4b3f" : "#ccc"}
					title="Toggle Brake Light"
					style={{ position: 'absolute', bottom: 30, right: 30 }}
					onPress={() => {this.state.connected ? this.sendMessage("1") : ""}}
				 />
            </View>

			</DrawerLayoutAndroid>
        );
    }
}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    connected: {
		position: 'absolute',
		top: 300,
        textAlign: 'center',
        color: '#fff',
        marginBottom: 5,
    },

	toolbar: {
		backgroundColor: '#db4b3f',
		height: 56,
		alignSelf: 'stretch',
	},

    backgroundImage: {
        flex: 1,
        resizeMode: 'contain', // or 'stretch'
    },

	toggleBrakeLightButton: {
		position: 'absolute',
		bottom: 30,
		right: 30,
		alignSelf: 'stretch',
		flexDirection: 'row',
	}
});


const toolbarActions = [
	{ title: 'Connect to Helmet', iconName: 'md-bluetooth', iconSize: 25, show: 'always' },
	{ title: 'Speech Regognition', iconName: 'md-microphone', iconSize: 25, show: 'always' },
]
