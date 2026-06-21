package com.luxart.ecommerce.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "supabase")
@Getter
@Setter
public class SupabaseProperties {

    private String url = "https://xslzrmvuehryagrdbklx.supabase.co";
    private String serviceKey = "";
    private Storage storage = new Storage();

    @Getter
    @Setter
    public static class Storage {
        private String bucket = "product-images";
    }
}
