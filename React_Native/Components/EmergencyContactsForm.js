import React, {Component} from 'react';
import SyncStorage from 'sync-storage';
import {
			StyleSheet,
			Text,
			TextInput,
			View,
			Button,
			ScrollView,
			TouchableOpacity,
			Alert
		} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';


type Props = {}; // default props


export default class EmergencyContactsForm extends Component<Props> {


    constructor(props) {

        super(props);

        this.state = { // state init
			name1: '',
			phoneNumber1: '',
			name2: '',
			phoneNumber2: '',
			name3: '',
			phoneNumber3: '',
        };

		this.handleNameChange1 = this.handleNameChange1.bind(this);
		this.handlePhoneNumberChange1 = this.handlePhoneNumberChange1.bind(this);
		this.handleNameChange2 = this.handleNameChange2.bind(this);
		this.handlePhoneNumberChange2 = this.handlePhoneNumberChange2.bind(this);
		this.handleNameChange3 = this.handleNameChange3.bind(this);
		this.handlePhoneNumberChange3 = this.handlePhoneNumberChange3.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.formSaved = this.formSaved.bind(this);
    }


	async componentWillMount () {

		let emergencyContacts = await this.props.getEmergencyContacts();

		this.setState({
			name1: emergencyContacts[0].name,
			phoneNumber1: emergencyContacts[0].phoneNumber,
			name2: emergencyContacts[1].name,
			phoneNumber2: emergencyContacts[1].phoneNumber,
			name3: emergencyContacts[2].name,
			phoneNumber3: emergencyContacts[2].phoneNumber,
		});
	}


	handleNameChange1(name1) {
		this.setState({ name1: name1 });
	}


	handlePhoneNumberChange1(phoneNumber1) {
		this.setState({ phoneNumber1: phoneNumber1 });
	}


	handleNameChange2(name2) {
		this.setState({ name2: name2 });
	}


	handlePhoneNumberChange2(phoneNumber2) {
		this.setState({ phoneNumber2: phoneNumber2 });
	}


	handleNameChange3(name3) {
		this.setState({ name3: name3 });
	}


	handlePhoneNumberChange3(phoneNumber3) {
		this.setState({ phoneNumber3: phoneNumber3 });
	}


	handleSubmit() {

		let emergencyContacts = [];

		let emergencyContact1 = {
			name: this.state.name1,
			phoneNumber: this.state.phoneNumber1
		};

		let emergencyContact2 = {
			name: this.state.name2,
			phoneNumber: this.state.phoneNumber2
		};

		let emergencyContact3 = {
			name: this.state.name3,
			phoneNumber: this.state.phoneNumber3
		};

		SyncStorage.set('emergencyContact1', emergencyContact1);
		SyncStorage.set('emergencyContact2', emergencyContact2);
		SyncStorage.set('emergencyContact3', emergencyContact3);

		emergencyContacts.push(
			emergencyContact1,
			emergencyContact2,
			emergencyContact3
		);

		this.props.saveEmergencyContactsToParentState(emergencyContacts);
		this.formSaved();
	}


	formSaved() {

		Alert.alert(
			"Emergency Contacts Saved",
			"",
			[
				{ text: "OK", onPress: () => console.log("OK Pressed") }
			],
			{ cancelable: false }
		);
	};


    render() { // renders view

        return (

			<ScrollView>

				<View style={styles.header}>
					<Text style={styles.title}>
          				{"My Emergency Contacts"}
        			</Text>
				</View>

				<View style={styles.inputContainer}>
					<TextInput
						style={styles.textInput}
						placeholder="Name of contact"
						maxLength={20}
						value={this.state.name1}
						onChangeText={this.handleNameChange1}
					/>
					<TextInput
						style={styles.textInput}
						placeholder="Phone number"
						maxLength={20}
						value={this.state.phoneNumber1}
						onChangeText={this.handlePhoneNumberChange1}
					/>
				</View>

				<View style={styles.inputContainer}>
					<TextInput
						style={styles.textInput}
						placeholder="Name of contact"
						maxLength={20}
						value={this.state.name2}
						onChangeText={this.handleNameChange2}
					/>
					<TextInput
						style={styles.textInput}
						placeholder="Phone number"
						maxLength={20}
						value={this.state.phoneNumber2}
						onChangeText={this.handlePhoneNumberChange2}
					/>
				</View>

				<View style={styles.inputContainer}>
					<TextInput
						style={styles.textInput}
						placeholder="Name of contact"
						maxLength={20}
						value={this.state.name3}
						onChangeText={this.handleNameChange3}
					/>
					<TextInput
						style={styles.textInput}
						placeholder="Phone number"
						maxLength={20}
						value={this.state.phoneNumber3}
						onChangeText={this.handlePhoneNumberChange3}
					/>
				</View>

				<View style={styles.inputContainer}>
					<TouchableOpacity
						style={styles.saveButton}
						onPress={this.handleSubmit}
					>
						<Text style={styles.saveButtonText}>Save</Text>
					</TouchableOpacity>
				</View>

			</ScrollView>
        );
    }
}


const styles = StyleSheet.create({

	inputContainer: {
		padding: 15,
		textAlign: 'center'
	},

	header: {
	    flex: 1,
		height: 56,
	    marginTop: 0,
	    marginBottom: 30,
	    justifyContent: 'center',
	    backgroundColor: '#db4b3f',
	},

	title: {
		fontSize: 20,
		color: '#fff',
    	fontWeight: 'bold',
		textAlign: 'center',
	},

	textInput: {
		borderColor: '#007BFF',
		borderTopWidth: 0,
		borderBottomWidth: 0,
		height: 40,
		fontSize: 15,
		paddingLeft: 20,
		paddingRight: 20
	},

	saveButton: {
		borderWidth: 1,
		borderColor: '#db4b3f',
		backgroundColor: '#db4b3f',
		padding: 15,
		margin: 5
	},

	saveButtonText: {
		color: '#FFFFFF',
		fontSize: 20,
		textAlign: 'center'
	}
});
