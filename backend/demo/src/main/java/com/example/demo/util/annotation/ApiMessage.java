package com.example.demo.util.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME) //ât loi khi chay
@Target(ElementType.METHOD) // cấp độ
public @interface ApiMessage {
    String value();
}
