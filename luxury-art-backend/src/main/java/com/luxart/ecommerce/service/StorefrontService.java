package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.StorefrontCheckoutRequest;
import com.luxart.ecommerce.dto.StorefrontCheckoutResponse;
import com.luxart.ecommerce.dto.VisitorRegisterRequest;
import com.luxart.ecommerce.dto.VisitorResponse;

public interface StorefrontService {

    VisitorResponse registerVisitor(VisitorRegisterRequest request);

    StorefrontCheckoutResponse checkout(StorefrontCheckoutRequest request);
}
