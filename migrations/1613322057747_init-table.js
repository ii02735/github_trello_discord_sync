/* eslint-disable camelcase */

exports.shorthands = undefined;


exports.up = pgm => {
    pgm.createTable('users', {
        id: 'id',
        trello: { type: 'varchar(255)', notNull: true },
        discord_id: { type: 'varchar(255)', notNull: true },
        discord_username: { type: 'varchar(255)', notNull: true },
        github_id: { type: 'int', notNull: true },
        github_username: { type: 'varchar(255)', notNull: true }
    })

    pgm.addConstraint('users', 'unique_mapping', { unique: ["trello", "discord_id", "discord_username", "github_id", "github_username"] })
};

exports.down = pgm => {
    pgm.deleteTable()
};
