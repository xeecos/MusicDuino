
float getUltrasonic(int pin){
    digitalWrite(pin,LOW);
    delayMicroseconds(2);
    digitalWrite(pin,HIGH);
    delayMicroseconds(10);
    digitalWrite(pin,LOW);
    pinMode(pin, INPUT);
    return pulseIn(pin, HIGH, 20000)/58.0;
}