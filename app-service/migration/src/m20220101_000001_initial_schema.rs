use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                sea_query::Table::create()
                    .table(Bill::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Bill::Id)
                            .uuid()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Bill::Title).string().not_null())
                    .col(ColumnDef::new(Bill::Text).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Bill::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Bill {
    Table,
    Id,
    PropublicaId,
    BillCode,
    BillUri,
    BillType,
    Title,
    ShortTitle,
    SponsorPropublicaId,
    SponsorState,
    SponsorParty,
    GpoPdfUri,
    CongressdotgovUrl,
    GovtrackUrl,
    IntroducedDate,
    Active,
    LastVote,
    HousePassage,
    SenatePassage,
    Enacted,
    Vetoed,
    Cosponsors,
    PrimarySubject,
    Summary,
    SummaryShort,
    LatestMajorActionDate,
    LatestMajorAction,
    LastUpdated,
    LegislativeDay,
    Committees,
    CommitteeCodes,
    SubcommitteeCodes,
    CosponsorsD,
    CosponsorsR,
    Subjects,
    Edited,
    HumanSummary,
    HumanShortSummary,
    HumanTitle,
    HumanShortTitle,
    Importance,
    CreatedAt,
    UpdatedAt,
}
