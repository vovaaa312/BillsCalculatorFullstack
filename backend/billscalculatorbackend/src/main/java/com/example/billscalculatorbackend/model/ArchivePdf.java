package com.example.billscalculatorbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "archive_pdfs")
@Getter
@Setter
@NoArgsConstructor
public class ArchivePdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archive_id", nullable = false)
    @JsonIgnore
    private DataArchive archive;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "data", nullable = false)
    private byte[] data;
}
