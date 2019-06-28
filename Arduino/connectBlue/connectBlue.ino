#include <SoftwareSerial.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_LIS3DH.h>
#include <Adafruit_Sensor.h>

SoftwareSerial BTSerial(6, 5); // RX | TX
#define        buzzer        9 //buzzer to arduino pin 9
#define        ledPin        8
#define        LED_FALL      4

// Used for software SPI
#define        LIS3DH_CLK    13
#define        LIS3DH_MISO          12
#define        LIS3DH_MOSI          11
// Used for hardware & software SPI
#define        LIS3DH_CS            10
#define        CLICKTHRESHHOLD      80
#define        FALL_MAG_THR   33
#define        BRAKE_THR      3


// software SPI
Adafruit_LIS3DH lis = Adafruit_LIS3DH(LIS3DH_CS, LIS3DH_MOSI, LIS3DH_MISO, LIS3DH_CLK);

#if defined(ARDUINO_ARCH_SAMD)
// for Zero, output on USB Serial console, remove line below if using programming port to program the Zero!
#define Serial SerialUSB
#endif


int state = 0;
int accel_array_index = 0;
unsigned int accel_array[50];
unsigned int sum = 0;
unsigned int previous_accel = 0;
int accel_counter = 0;
int max_index = 0;
int mag = 0;
bool setup_let = true;
int cpt = 0;


void setup()
{
#ifndef ESP8266
  while (!Serial);     // will pause Zero, Leonardo, etc until serial console opens
#endif

  pinMode(ledPin, OUTPUT);
  pinMode(LED_FALL, OUTPUT);
  pinMode(9, OUTPUT);  // this pin will pull the HC-05 pin 34 (key pin) HIGH to switch module to AT mode
  pinMode(buzzer, OUTPUT); // Set buzzer - pin 9 as an output
  digitalWrite(9, HIGH);
  Serial.begin(9600);
  Serial.println("KSH");
  BTSerial.begin(9600);

  if (! lis.begin(0x18)) {   // change this to 0x19 for alternative i2c address
    Serial.println("Couldnt start");
    while (1);
  }

  lis.setRange(LIS3DH_RANGE_4_G);   // 2, 4, 8 or 16 G!

  Serial.print("Range = "); Serial.print(2 << lis.getRange());
  Serial.println("G");

  // 0 = turn off click detection & interrupt
  // 1 = single click only interrupt output
  // 2 = double click only interrupt output, detect single click
  // Adjust threshhold, higher numbers are less sensitive
  lis.setClick(2, CLICKTHRESHHOLD);
  delay(100);
}

void loop()
{
  bool accel_event = false;
  bool tof_event = false;
  sensors_event_t event;
  lis.getEvent(&event);

  // Keep reading from HC-05 and send to Arduino Serial Monitor
  if (BTSerial.available()) {
    state = BTSerial.read();
    if (state != '\n') {
      BTSerial.println("bien recu");
      Serial.println(state);
      int digit = digit_to_int(state);
      set_led(digit);
      if (digit == 1) {
        if (setup_let) {
          setup_let = false;
          Serial.println("desable led ");
          BTSerial.println("frein desactiver");
        } else {
          setup_let = true;
          Serial.println("enable led ");
          BTSerial.println("frein activer");
        }
      }
    }
  }

  // Keep reading from Arduino Serial Monitor and send to HC-05
  if (Serial.available()) {
    state = Serial.read();
    if (state != '\n') {
      Serial.println(state);
      int digit = digit_to_int(state);
      Serial.println(digit);
      set_led(digit);
      BTSerial.write(Serial.read());
      Serial.write(Serial.read());
    }
  }
  // detecttap();
  detection_Fall(accel_event, tof_event, event);
}


/* --------------------------------------------------------------- */
/* Function to detect fall                                 */
/* --------------------------------------------------------------- */
bool detection_Fall(bool accel_event, bool tof_event, sensors_event_t event) {
  if (accel_array_index < (sizeof(accel_array) / sizeof(unsigned int)))
  {
    mag = sqrt(sq(event.acceleration.x) + sq(event.acceleration.y) + sq(event.acceleration.z));
    // Serial.print(" \t mag : "); Serial.println(mag);
    //detect if there is a fall event (magnitude higher than FALL_MAG_THR)
    if (mag > FALL_MAG_THR) {
      Serial.print(" \t mag : "); Serial.println(mag);
      Serial.println();
      if (mag > 40) {
        set_led(3);
        song();
        BTSerial.println("je suis un choc");
        ledEmergencyAnim();
      } else {
        set_led(0);
      }
    } /* else {
      if (mag > 20 && mag < FALL_MAG_THR) { //frein
        digitalWrite(ledPin, HIGH); // Turn LED OFF
        Serial.println(mag);
        Serial.println("LED: ON");
      } else {
        digitalWrite(ledPin, LOW); // Turn LED OFF
        // Serial.println("LED: OFF");
        }
     } */


    // detect the acceleration peak in real-time and store the index of this measure in the array
    accel_event = accelEventDetection(mag);

    //store the magnitude in an array
    accel_array[accel_array_index] = mag;
    accel_array_index++;
  } else {
    for (int i = 0; i < (sizeof(accel_array) / sizeof(unsigned int)); i++)
    {
      sum = accel_array[i] + sum;
    }
    sum = sum / 50;
    accel_array_index = 0;
  }
}

/* --------------------------------------------------------------- */
/* Function to Start and stop led                                  */
/* --------------------------------------------------------------- */

void set_led(int state) {
  if (state == 0) {
    digitalWrite(ledPin, LOW); // Turn LED OFF
  } else if (state == 3 && setup_let != false) {
    digitalWrite(ledPin, HIGH);
    state = 0;
  }
}

/* --------------------------------------------------------------- */
/* Function to emit song                                  */
/* --------------------------------------------------------------- */

void song() {
  tone(buzzer, 1000); // Send 1KHz sound signal..
  delay(100);
  noTone(buzzer);
}

/* --------------------------------------------------------------- */
/* Function to parse char to Int                                   */
/* --------------------------------------------------------------- */

int digit_to_int(char d)
{
  int someInt = d - '0';
  Serial.println(someInt);
  return someInt;
}

/* --------------------------------------------------------------- */
/* Function to detect if an choc is detected                       */
/* --------------------------------------------------------------- */

bool accelEventDetection(int accelMag) {
  bool detectionEvent = false;
  mag = accelMag;
  // Serial.println("\tprev :");Serial.println(previous_accel);
  if (mag > previous_accel)
  {
    max_index = accel_array_index;
    accel_counter++;                      //store consecutive increase to detect acceleration event
  } else {
    if (accel_counter > 0)
    {
      accel_counter--;
      // Serial.println(mag);
    }
    /*Serial.println(previous_accel);
      if (previous_accel < 10) {
      set_led(0);
      }*/
  }
  // Serial.println(mag);
  previous_accel = mag;
  //filter to
  if (accel_counter > BRAKE_THR)
  {
    Serial.println("--------------ACCELERATION--------------");
    accel_counter = 0;
    detectionEvent = true;
  }
  else if (accel_counter < 2) {
    set_led(0);
   // Serial.println("Arret ");
  } else {
    set_led(3);
   // Serial.println("frein ");
  }
  return detectionEvent;
}

/* --------------------------------------------------------------- */
/* Function to start the Led animamtion when there is a fall detection event*/
/* --------------------------------------------------------------- */
void ledEmergencyAnim(void)
{
  for (int j = 0; j < 10; j++)
  {
    digitalWrite(LED_FALL, HIGH);   // turn the LED on (HIGH is the voltage level)
    delay(300);                       // wait for a second
    digitalWrite(LED_FALL, LOW);    // turn the LED off by making the voltage LOW
    delay(300);
  }

}
