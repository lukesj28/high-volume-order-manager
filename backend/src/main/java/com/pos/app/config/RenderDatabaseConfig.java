package com.pos.app.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class RenderDatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource dataSource(DataSourceProperties properties) throws URISyntaxException {
        if (databaseUrl != null && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            URI dbUri = new URI(databaseUrl);
            String userInfo = dbUri.getUserInfo();
            String[] userParts = userInfo != null ? userInfo.split(":", 2) : null;
            String username = userParts != null ? userParts[0] : "";
            String password = userParts != null && userParts.length > 1 ? userParts[1] : "";
            String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' +
                          (dbUri.getPort() != -1 ? dbUri.getPort() : 5432) +
                           dbUri.getPath() + "?sslmode=require";

            return properties.initializeDataSourceBuilder()
                    .type(HikariDataSource.class)
                    .url(dbUrl)
                    .username(username)
                    .password(password)
                    .build();
        }

        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }
}
