update index_companies set status = 0 where company_id = 20 and index_id = 1;

update index_companies set status = 0 where company_id = 135 and index_id = 2;

update index_companies set status = 0 where company_id = 124 and index_id = 2;

update index_companies set status = 0 where company_id = 131 and index_id = 2;

update index_companies set status = 0 where company_id = 150 and index_id = 2;

update index_companies set status = 0 where company_id = 107 and index_id = 2;

update index_companies set status = 0 where company_id = 118 and index_id = 2;

insert into sectors (`name`, `created_at`, `updated_at`)
    values ('Textiles', NOW(), NOW());

insert into companies (`name`, `symbol`, `sector_id`, `created_at`, `updated_at`)
    values
    ('Bajaj Holdings & Investment Ltd.', 'BAJAJHLDNG', 1, NOW(), NOW()),
    ('Divi\'s Laboratories Ltd.', 'DIVISLAB', 2, NOW(), NOW()),
    ('HDFC Asset Management Company Ltd.', 'HDFCAMC', 2, NOW(), NOW()),
    ('Page Industries Ltd.', 'PAGEIND', 16, NOW(), NOW()),
    ('United Breweries Ltd.', 'UBL', 5, NOW(), NOW());

insert into index_companies (`index_id`, `company_id`, `status`, `created_at`, `updated_at`)
    values (1, 135, 1, NOW(), NOW()),
    (2, 20, 1, NOW(), NOW()), 
    (2, 155, 1, NOW(), NOW()),
    (2, 154, 1, NOW(), NOW()),
    (2, 153, 1, NOW(), NOW()),
    (2, 152, 1, NOW(), NOW()),
    (2, 151, 1, NOW(), NOW());
    
    