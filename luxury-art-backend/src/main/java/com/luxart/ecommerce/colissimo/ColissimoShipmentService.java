package com.luxart.ecommerce.colissimo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luxart.ecommerce.colissimo.dto.ColissimoAddParcelRequest;
import com.luxart.ecommerce.colissimo.dto.ColissimoApiResponse;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.OrderItem;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ColissimoShipmentService {

    private static final List<String> GOUVERNORATS = List.of(
            "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
            "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
            "Médenine", "Monastir", "Nabeul", "Sfax", "Sousse", "Siliana",
            "Sidi Bouzid", "Tataouine", "Tozeur", "Tunis", "Zaghouan");

    private final ColissimoSoapClient soapClient;
    private final ObjectMapper objectMapper;

    /**
     * Envoie la commande à Colissimo si elle est confirmée et n'a pas encore de code à barre.
     * @return true si un colis a été créé ou était déjà présent
     */
    public boolean pushOrderIfNeeded(Order order) {
        if (!soapClient.isConfigured()) {
            return false;
        }
        if (order.getColissimoCodeBarre() != null && !order.getColissimoCodeBarre().isBlank()) {
            return true;
        }
        if (!isEligibleForColissimo(order)) {
            return false;
        }

        try {
            ColissimoAddParcelRequest request = buildParcelRequest(order);
            String codeBarre = soapClient.addParcel(toPicJson(request));
            order.setColissimoCodeBarre(codeBarre);
            order.setNumeroColis(codeBarre);
            order.setColissimoReference(request.getReference());
            order.setColissimoEtat("En Attente");
            order.setColissimoDesignation(request.getDesignation());
            order.setColissimoImportedAt(LocalDateTime.now());
            log.info("Colis Colissimo créé pour commande #{} — code {}", order.getId(), codeBarre);
            return true;
        } catch (ColissimoApiException e) {
            log.warn("Impossible de créer le colis Colissimo pour commande #{}: {}",
                    order.getId(), e.getMessage());
            return false;
        }
    }

    public byte[] getInvoicePdf(Order order) {
        String code = resolveCodeBarre(order);
        if (code == null || code.isBlank()) {
            throw new ColissimoApiException(
                    "Aucun code Colissimo — confirmez la commande pour créer le colis");
        }
        return soapClient.getParcelPdf(code);
    }

    public byte[] getInvoicePdfByCode(String codeBarre) {
        return soapClient.getParcelPdf(codeBarre);
    }

    public String resolveCodeBarre(Order order) {
        if (order.getColissimoCodeBarre() != null && !order.getColissimoCodeBarre().isBlank()) {
            return order.getColissimoCodeBarre();
        }
        String numero = order.getNumeroColis();
        if (numero != null && numero.matches("\\d{10,}")) {
            return numero;
        }
        return null;
    }

    public boolean isEligibleForColissimo(Order order) {
        OrderStatut s = order.getStatut();
        return s == OrderStatut.CONFIRMEE || s == OrderStatut.EXPEDIEE || s == OrderStatut.LIVREE;
    }

    ColissimoAddParcelRequest buildParcelRequest(Order order) {
        String clientNom = order.getClientNom() != null && !order.getClientNom().isBlank()
                ? order.getClientNom().trim()
                : order.getUser().getNom();

        String telephone = order.getClientTelephone() != null && !order.getClientTelephone().isBlank()
                ? order.getClientTelephone().trim()
                : "00000000";

        AddressParts address = parseAddress(order.getAdresseLivraison());
        BigDecimal prix = order.getTotal() != null && order.getTotal().compareTo(BigDecimal.ZERO) > 0
                ? order.getTotal()
                : order.calcTotal();

        int nbPieces = order.getItems().stream()
                .mapToInt(OrderItem::getQuantite)
                .sum();
        if (nbPieces <= 0) {
            nbPieces = 1;
        }

        return ColissimoAddParcelRequest.builder()
                .reference(buildReference(order))
                .client(clientNom)
                .adresse(address.adresse())
                .ville(address.ville())
                .gouvernorat(address.gouvernorat())
                .nbPieces(nbPieces)
                .prix(prix)
                .tel1(telephone)
                .tel2("")
                .designation(buildDesignation(order))
                .commentaire(buildCommentaire(order))
                .type("VO")
                .echange(0)
                .build();
    }

    private String buildReference(Order order) {
        String prefix = switch (order.getCanal() != null ? order.getCanal() : OrderCanal.SITE_WEB) {
            case FACEBOOK -> "FC";
            case INSTAGRAM -> "INST";
            case WHATSAPP -> "WA";
            default -> "WEB";
        };
        return prefix + "-LX-" + order.getId();
    }

    private String buildDesignation(Order order) {
        if (order.getColissimoDesignation() != null && !order.getColissimoDesignation().isBlank()) {
            return order.getColissimoDesignation().trim();
        }
        if (order.getItems().isEmpty()) {
            return "Commande Luxury Art #" + order.getId();
        }
        return order.getItems().stream()
                .map(item -> {
                    String nom = item.getProduct().getNom();
                    return item.getQuantite() > 1 ? nom + " x" + item.getQuantite() : nom;
                })
                .collect(Collectors.joining(", "));
    }

    private String buildCommentaire(Order order) {
        OrderCanal canal = order.getCanal() != null ? order.getCanal() : OrderCanal.SITE_WEB;
        StringBuilder sb = new StringBuilder("Canal: ").append(canal.name());
        if (order.getReferenceFacebook() != null && !order.getReferenceFacebook().isBlank()) {
            sb.append(" | FB: ").append(order.getReferenceFacebook());
        }
        if (order.getReferenceInstagram() != null && !order.getReferenceInstagram().isBlank()) {
            sb.append(" | IG: ").append(order.getReferenceInstagram());
        }
        if (order.getReferenceWhatsapp() != null && !order.getReferenceWhatsapp().isBlank()) {
            sb.append(" | WA: ").append(order.getReferenceWhatsapp());
        }
        return sb.toString();
    }

    record AddressParts(String adresse, String ville, String gouvernorat) {}

    AddressParts parseAddress(String raw) {
        if (raw == null || raw.isBlank()) {
            return new AddressParts("Adresse à compléter", "Tunis", "Tunis");
        }

        String cleaned = raw.lines()
                .filter(line -> !line.startsWith("Article:") && !line.startsWith("Note:"))
                .collect(Collectors.joining(", "))
                .trim();

        String gouvernorat = "Tunis";
        String ville = "Tunis";
        String adresse = cleaned;

        for (String gov : GOUVERNORATS) {
            if (containsGovernorate(cleaned, gov)) {
                gouvernorat = gov;
                break;
            }
        }

        String[] parts = cleaned.split(",");
        if (parts.length >= 2) {
            String last = parts[parts.length - 1].trim();
            if (containsGovernorate(last, gouvernorat)) {
                adresse = String.join(", ", java.util.Arrays.copyOf(parts, parts.length - 1)).trim();
                if (parts.length >= 3) {
                    ville = parts[parts.length - 2].trim();
                } else {
                    ville = gouvernorat;
                }
            } else if (parts.length >= 2) {
                ville = parts[parts.length - 1].trim();
                adresse = String.join(", ", java.util.Arrays.copyOf(parts, parts.length - 1)).trim();
            }
        }

        if (adresse.isBlank()) {
            adresse = cleaned;
        }
        if (ville.isBlank()) {
            ville = gouvernorat;
        }

        return new AddressParts(adresse, ville, gouvernorat);
    }

    private static boolean containsGovernorate(String text, String gouvernorat) {
        return text.toLowerCase(Locale.ROOT)
                .contains(gouvernorat.toLowerCase(Locale.ROOT).replace("é", "e"));
    }

    String toPicJson(ColissimoAddParcelRequest request) {
        try {
            Map<String, Object> pic = new LinkedHashMap<>();
            pic.put("reference", request.getReference());
            pic.put("client", request.getClient());
            pic.put("adresse", request.getAdresse());
            pic.put("ville", request.getVille());
            pic.put("gouvernorat", request.getGouvernorat());
            pic.put("nb_pieces", request.getNbPieces());
            pic.put("prix", request.getPrix());
            pic.put("tel1", request.getTel1());
            pic.put("tel2", request.getTel2() != null ? request.getTel2() : "");
            pic.put("designation", request.getDesignation());
            pic.put("commentaire", request.getCommentaire() != null ? request.getCommentaire() : "");
            pic.put("type", request.getType() != null ? request.getType() : "VO");
            pic.put("echange", request.getEchange() != null ? request.getEchange() : 0);
            return objectMapper.writeValueAsString(pic);
        } catch (Exception e) {
            throw new ColissimoApiException("Impossible de préparer le colis Colissimo", e);
        }
    }
}
