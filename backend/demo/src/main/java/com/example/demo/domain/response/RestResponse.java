package com.example.demo.domain.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RestResponse<T> {
     int statusCode;
     String error;
    // mesage có thể là String hoặc Arraylisst
     Object mesage;
     T data;
}
