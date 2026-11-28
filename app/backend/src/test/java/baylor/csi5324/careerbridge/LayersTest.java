package baylor.csi5324.careerbridge;

import baylor.csi5324.careerbridge.model.Application;
import baylor.csi5324.careerbridge.model.JobPosting;
import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaMethodCall;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import java.util.Set;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

// spec/architecture.md "Backend layers" and spec/design.md: the review alone let these slip (SCRUM-253)
@AnalyzeClasses(packages = "baylor.csi5324.careerbridge", importOptions = ImportOption.DoNotIncludeTests.class)
class LayersTest {

    // config is not a layer of the specification: it wires the app and loads the sample data
    @ArchTest
    static final ArchRule aLayerCallsOnlyTheLayerBelow = layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            .layer("Controller").definedBy("..controller..")
            .layer("Service").definedBy("..service..")
            .layer("Repository").definedBy("..repository..")
            .layer("Model").definedBy("..model..")
            .layer("Config").definedBy("..config..")
            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller", "Config")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service", "Config")
            .whereLayer("Model").mayOnlyBeAccessedByLayers("Controller", "Service", "Repository", "Config");

    // Also catches @ResponseStatus on a service exception: the controller decides the status (design.md)
    @ArchTest
    static final ArchRule servicesKnowNothingOfHttp = noClasses()
            .that().resideInAnyPackage("..service..", "..repository..", "..model..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework.web..", "org.springframework.http..", "jakarta.servlet..");

    // ADR-0015: a lifecycle move runs inside the service's transaction, after its locks. Called from a
    // controller on an entity the service returned, it would run unlocked and never be saved.
    private static final Set<String> LIFECYCLE_MOVES = Set.of(
            "advance", "reject", "recordInterview", "extendOffer", "reviseOffer", "withdraw", "acceptOffer",
            "declineOffer", "submit", "approve", "returnToRecruiter", "closeByRecruiter", "fill", "expire",
            "backfillLegacyHistory", "backfillLegacyOffer");

    private static final DescribedPredicate<JavaMethodCall> aLifecycleMove = DescribedPredicate.describe(
            "a lifecycle move of Application or JobPosting",
            call -> LIFECYCLE_MOVES.contains(call.getName())
                    && (call.getTargetOwner().isEquivalentTo(Application.class)
                    || call.getTargetOwner().isEquivalentTo(JobPosting.class)));

    @ArchTest
    static final ArchRule onlyServicesMoveALifecycle = noClasses()
            .that().resideOutsideOfPackages("..service..", "..config..", "..model..")
            .should().callMethodWhere(aLifecycleMove);
}
