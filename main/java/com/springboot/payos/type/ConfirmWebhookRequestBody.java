package com.springboot.payos.type;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConfirmWebhookRequestBody {
  private String webhookUrl;

  public ConfirmWebhookRequestBody(String webhookUrl) {
    this.webhookUrl = webhookUrl;
  }
}
