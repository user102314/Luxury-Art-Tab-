package com.luxart.ecommerce.audit;

public final class AdminAuditContext {

    private static final ThreadLocal<AdminActor> ACTOR = new ThreadLocal<>();

    private AdminAuditContext() {
    }

    public static void set(AdminActor actor) {
        ACTOR.set(actor);
    }

    public static AdminActor get() {
        return ACTOR.get();
    }

    public static void clear() {
        ACTOR.remove();
    }
}
