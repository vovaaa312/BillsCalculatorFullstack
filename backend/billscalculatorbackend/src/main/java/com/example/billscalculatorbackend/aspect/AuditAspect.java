package com.example.billscalculatorbackend.aspect;

import com.example.billscalculatorbackend.annotation.Audit;
import com.example.billscalculatorbackend.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Parameter;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;

    @AfterReturning(pointcut = "@annotation(audit)", returning = "result")
    public void logSuccess(JoinPoint jp, Audit audit, Object result) {
        try {
            String entityId = extractEntityId(jp, result);
            auditService.log(resolveEmail(), audit.action(), audit.entityType(), entityId,
                    "SUCCESS", extractIp(), null, audit.category());
        } catch (Exception ignored) {}
    }

    @AfterThrowing(pointcut = "@annotation(audit)", throwing = "ex")
    public void logFailure(JoinPoint jp, Audit audit, Exception ex) {
        try {
            String entityId = extractEntityId(jp, null);
            String details = ex.getMessage();
            if (details != null && details.length() > 500) details = details.substring(0, 500);
            auditService.log(resolveEmail(), audit.action(), audit.entityType(), entityId,
                    "FAILURE", extractIp(), details, audit.category());
        } catch (Exception ignored) {}
    }

    private String extractEntityId(JoinPoint jp, Object result) {
        MethodSignature sig = (MethodSignature) jp.getSignature();
        Parameter[] params = sig.getMethod().getParameters();
        Object[] args = jp.getArgs();
        for (int i = 0; i < params.length; i++) {
            PathVariable pv = params[i].getAnnotation(PathVariable.class);
            if (pv != null && args[i] instanceof Long) {
                String pvName = !pv.value().trim().isEmpty() ? pv.value() : params[i].getName();
                if ("id".equals(pvName)) return String.valueOf(args[i]);
            }
        }
        // Try return value (unwrap ResponseEntity if needed)
        Object body = result instanceof ResponseEntity<?> re ? re.getBody() : result;
        if (body != null) {
            try {
                Object id = body.getClass().getMethod("getId").invoke(body);
                if (id != null) return String.valueOf(id);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String extractIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String ip = req.getHeader("X-Real-IP");
                return (ip != null && !ip.trim().isEmpty()) ? ip : req.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String resolveEmail() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return null;
    }
}
