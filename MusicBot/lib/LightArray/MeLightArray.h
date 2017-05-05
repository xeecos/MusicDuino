
uint8_t sensors[3];

uint8_t getButtonValues(int pin)
{  
    long time_out_flag = 0;
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(980);
    digitalWrite(pin, HIGH);
    delayMicroseconds(40);
    pinMode(pin, INPUT_PULLUP);
    delayMicroseconds(50); 
    time_out_flag = millis();
    while((digitalRead(pin) == 0)&&((millis() - time_out_flag) < 6)); 
    time_out_flag = millis();
    while((digitalRead(pin) == 1)&&((millis() - time_out_flag) < 6));
    for(uint8_t k=0; k<3; k++)
    {
        sensors[k] = 0x00;
        for(uint8_t i=0;i<8;i++)
        {
            time_out_flag = millis(); 
            while(digitalRead(pin) == 0&&((millis() - time_out_flag) < 6));
            uint32_t HIGH_level_read_time = micros();
            time_out_flag = millis(); 
            while(digitalRead(pin) == 1&&((millis() - time_out_flag) < 6));
            HIGH_level_read_time = micros() - HIGH_level_read_time;
            if(HIGH_level_read_time > 50 && HIGH_level_read_time < 100)  
            {
                sensors[k] |= (0x80 >> i);
            }
        }
    }
    if (sensors[1] == (uint8_t)(~(uint8_t)sensors[0]))
    {
       return sensors[0];
    }
}